const express = require('express');
const mysql = require('mysql2/promise'); // ใช้แบบ Promise เพื่อเขียน Async/Await ได้
const cors = require('cors');
const bodyParser = require('body-parser');
const generatePayload = require('promptpay-qr');
const SHOP_PROMPTPAY_ID = '0980077527';
const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer');


const app = express();
app.use(cors()); // อนุญาตให้ Frontend (React) เรียกใช้งานได้
app.use(bodyParser.json());

// ตั้งค่าการเชื่อมต่อ Database
const dbConfig = {
    host: 'localhost',
    user: 'root',      // แก้เป็น user ของคุณ (ปกติ XAMPP ใช้ root)
    password: 'acsp12591',      // แก้เป็น password ของคุณ (ปกติ XAMPP ปล่อยว่าง)
    database: 'pos_db'
};

// API 1: ดึงรายการสินค้าทั้งหมด (สำหรับแสดงหน้าขาย)
app.get('/products', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM products');
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API 2: สร้างออเดอร์และตัดสต็อก (Transaction)
// นี่คือหัวใจสำคัญ: ต้องตัดสต็อกและบันทึกบิลพร้อมกัน ถ้าอย่างใดอย่างหนึ่งพัง ต้องยกเลิกทั้งหมด
app.post('/checkout', async (req, res) => {
    const { cart, totalAmount, paymentMethod } = req.body;
    const connection = await mysql.createConnection(dbConfig);

    try {
        // เริ่มต้น Transaction (ล็อคข้อมูล)
        await connection.beginTransaction();

        // 1. สร้าง Order หลัก
        const [orderResult] = await connection.execute(
            'INSERT INTO orders (total_amount, payment_method) VALUES (?, ?)',
            [totalAmount, paymentMethod]
        );
        const orderId = orderResult.insertId;

        // 2. วนลูปสินค้าในตะกร้า เพื่อบันทึกรายการและตัดสต็อก
        for (const item of cart) {
            // บันทึกรายการสินค้าในบิล
            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price_per_unit) VALUES (?, ?, ?, ?)',
                [orderId, item.id, item.qty, item.price]
            );

            // ตัดสต็อก (ลดจำนวน stock ตาม qty)
            await connection.execute(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.qty, item.id]
            );
        }

        // ยืนยันการทำงานทั้งหมด (Commit)
        await connection.commit();
        res.json({ message: 'ขายสำเร็จ!', orderId });

    } catch (error) {
        // ถ้ามีอะไรผิดพลาด ให้ย้อนกลับข้อมูลทั้งหมด (Rollback) สินค้าจะไม่ถูกตัดฟรี
        await connection.rollback();
        res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + error.message });
    } finally {
        await connection.end();
    }
});

// API 3: Dashboard - สรุปยอดขายรายวัน ตามเดือนที่เลือก
app.get('/dashboard/daily', async (req, res) => {
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();

    const connection = await mysql.createConnection(dbConfig);
    try {
        // แก้ไข SQL Query ตรงนี้ครับ
        const [rows] = await connection.execute(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d') as date,
                SUM(total_amount) as totalSales,
                COUNT(id) as totalOrders
            FROM orders
            WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
            GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')  
            ORDER BY date ASC
        `, [month, year]);

        res.json(rows);
    } catch (error) {
        // ให้ Console log error ออกมาดูที่ Terminal ฝั่ง Server ด้วยจะได้รู้สาเหตุ
        console.error("Dashboard SQL Error:", error); 
        res.status(500).json({ error: error.message });
    } finally {
        await connection.end();
    }
});

app.get('/generate-qr', (req, res) => {
    const amount = parseFloat(req.query.amount);
    // สร้าง Payload (รหัสข้อความสำหรับทำ QR)
    const payload = generatePayload(SHOP_PROMPTPAY_ID, { amount });
    res.json({ payload });
});

// API 5: สั่งพิมพ์ใบเสร็จ (Simulation Mode)
app.post('/print-receipt', async (req, res) => {
    const { orderId, cart, total, paymentMethod } = req.body;

    // ตั้งค่าเครื่องพิมพ์ (จำลอง)
    let printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,   // หรือ STAR แล้วแต่ยี่ห้อที่จะซื้อ (EPSON เป็นมาตรฐาน)
        interface: 'console',       // <--- จุดสำคัญ! สั่งให้พ่นออกมาทาง Console แทนเครื่องจริง
        characterSet: CharacterSet.THAI_THAI42, // รองรับภาษาไทย (ถ้าเครื่องรองรับ)
        width: 48,                  // ความกว้างกระดาษ (ปกติ 48 ตัวอักษรสำหรับ 80mm)
    });

    try {
        // --- เริ่มวาดใบเสร็จ ---
        
        // 1. หัวบิล
        printer.alignCenter();
        printer.bold(true);
        printer.println("ร้าน My POS Shop");
        printer.bold(false);
        printer.println("สาขาสยามสแควร์");
        printer.println("--------------------------------");
        
        // 2. รายละเอียดออเดอร์
        printer.alignLeft();
        printer.println(`Order ID: #${orderId}`);
        printer.println(`Date: ${new Date().toLocaleString('th-TH')}`);
        printer.println(`Pay by: ${paymentMethod}`);
        printer.println("--------------------------------");

        // 3. รายการสินค้า
        // การจัดหน้าแบบ ตาราง: ซ้าย(ชื่อ) ขวา(ราคา)
        printer.tableCustom([
            { text: "Item", align: "LEFT", width: 0.5 },
            { text: "Qty", align: "CENTER", width: 0.2 },
            { text: "Price", align: "RIGHT", width: 0.3 }
        ]);
        
        cart.forEach(item => {
            printer.tableCustom([
                { text: item.name, align: "LEFT", width: 0.5 },
                { text: `${item.qty}`, align: "CENTER", width: 0.2 },
                { text: `${item.price * item.qty}`, align: "RIGHT", width: 0.3 }
            ]);
        });

        printer.println("--------------------------------");

        // 4. ยอดรวม
        printer.alignRight();
        printer.bold(true);
        printer.setTextSize(1, 1); // ขยายตัวหนังสือใหญ่ขึ้น
        printer.println(`TOTAL: ${total.toLocaleString()} THB`);
        printer.setTextSize(0, 0); // กลับมาไซส์ปกติ
        printer.bold(false);
        
        // 5. ท้ายบิล
        printer.alignCenter();
        printer.println("--------------------------------");
        printer.println("Thank you / Khob Khun Krub");
        printer.println("Wifi Password: 12345678");
        
        // 6. สั่งตัดกระดาษ และเปิดลิ้นชัก (ถ้ามี)
        printer.cut();
        printer.openCashDrawer();

        // --- สั่งพิมพ์ (ในที่นี้คือแสดงผลทาง Console) ---
        console.log(printer.getText()); // ดูข้อความดิบๆ
        // printer.execute(); // <--- บรรทัดนี้ใช้สำหรับเครื่องจริง
        
        res.json({ success: true, message: "พิมพ์จำลองสำเร็จ (ดูที่ Console Server)" });

    } catch (error) {
        console.error("Print Error:", error);
        res.status(500).json({ error: "ไม่สามารถพิมพ์ได้" });
    }
});

// API: เพิ่มสินค้าใหม่ (Create)
app.post('/products', async (req, res) => {
    const { name, barcode, price, stock, image_url } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [result] = await connection.execute(
            'INSERT INTO products (name, barcode, price, stock, image_url) VALUES (?, ?, ?, ?, ?)',
            [name, barcode, price, stock, image_url]
        );
        res.json({ id: result.insertId, message: 'เพิ่มสินค้าเรียบร้อย' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await connection.end();
    }
});

// API: แก้ไขสินค้า (Update)
app.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, barcode, price, stock, image_url } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.execute(
            'UPDATE products SET name=?, barcode=?, price=?, stock=?, image_url=? WHERE id=?',
            [name, barcode, price, stock, image_url, id]
        );
        res.json({ message: 'แก้ไขข้อมูลเรียบร้อย' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await connection.end();
    }
});

// API: ลบสินค้า (Delete)
app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.execute('DELETE FROM products WHERE id=?', [id]);
        res.json({ message: 'ลบสินค้าเรียบร้อย' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await connection.end();
    }
});

// รัน Server ที่ Port 3000
app.listen(3000, () => {
    console.log('POS Backend running on port 3000');
});