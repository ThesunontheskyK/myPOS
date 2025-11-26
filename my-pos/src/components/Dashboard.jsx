import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard({ formatCurrency }) {
    const [salesData, setSalesData] = useState([]); // ค่าเริ่มต้นเป็น array ว่าง
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // ดึงข้อมูลเมื่อมีการเปลี่ยนเดือนหรือปี
    useEffect(() => {
    fetch(`http://localhost:3000/dashboard/daily?month=${selectedMonth}&year=${selectedYear}`)
      .then(res => {
        // เช็คก่อนว่า Server ตอบกลับมาดีไหม (Status 200)
        if (!res.ok) {
          throw new Error('Server Error');
        }
        return res.json();
      })
      .then(data => {
        // เช็คซ้ำว่าเป็น Array จริงไหม
        if (Array.isArray(data)) {
            setSalesData(data);
        } else {
            setSalesData([]); // ถ้าไม่ใช่ Array ให้เซ็ตเป็นว่างไว้ก่อน
        }
      })
      .catch(err => {
        console.error("Fetch Error:", err);
        setSalesData([]); // ถ้ามี Error ให้เซ็ตเป็นว่าง กันจอขาว
      });
  }, [selectedMonth, selectedYear]);
  const safeData = Array.isArray(salesData) ? salesData : [];


    // คำนวณยอดรวมทั้งเดือน
const totalMonthlySales = safeData.reduce((sum, item) => sum + Number(item.totalSales), 0);
  const totalMonthlyOrders = safeData.reduce((sum, item) => sum + item.totalOrders, 0);
    return (
        <div className="dashboard-container">
            <h2>📊 สรุปยอดขาย</h2>

            {/* ส่วนเลือกเดือน/ปี */}
            <div className="filters">
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                >
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                            เดือน {new Date(0, i).toLocaleDateString('th-TH', { month: 'long' })}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                </select>
            </div>

            {/* การ์ดสรุปยอดรวม */}
            <div className="summary-cards">
                <div className="card">
                    <h3>ยอดขายรวม</h3>
                    <p className="highlight">{formatCurrency(totalMonthlySales)}</p>
                </div>
                <div className="card">
                    <h3>จำนวนบิล</h3>
                    <p>{totalMonthlyOrders} บิล</p>
                </div>
            </div>



            [Image of bar chart displaying sales data]


            {/* กราฟแท่งแสดงยอดขายรายวัน */}
            <div className="chart-section" style={{ height: 400, marginTop: '20px' }}>
                <h3>แนวโน้มรายวัน</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={safeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(str) => str.split('-')[2]} /> {/* โชว์แค่วันที่ */}
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="totalSales" fill="#2563eb" name="ยอดขาย" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* ตารางรายละเอียด */}
            <div className="table-section">
                <h3>ตารางรายละเอียด</h3>
                <table>
                    <thead>
                        <tr>
                            <th>วันที่</th>
                            <th>จำนวนบิล</th>
                            <th>ยอดขาย</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeData.map((item, index) => (
                            <tr key={index}>
                                <td>{item.date}</td>
                                <td>{item.totalOrders}</td>
                                <td>{formatCurrency(item.totalSales)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}