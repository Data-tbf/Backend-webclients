// Import các thư viện cần thiết
import fetch from 'node-fetch';
import { DataModel } from '../../models/CodaData.js';

// Hàm lấy và lưu dữ liệu từ API Coda
async function fetchDataAndSave() {
    const apiToken = process.env.CODA_API_TOKEN;

    const mydata = await fetch("https://coda.io/apis/v1/docs/7sk4ZtS6kG/tables/table-rDuaevjmdx/rows", {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!mydata.ok) {
        console.error('Lỗi khi lấy dữ liệu:', mydata.status, mydata.statusText);
        throw new Error('Lỗi khi lấy dữ liệu từ API Coda');
    }

    const response = await mydata.json();

    // Xóa dữ liệu cũ trong MongoDB
    await DataModel.deleteMany({});
    console.log('Đã xóa dữ liệu cũ');

    // Lặp qua từng hàng và lưu dữ liệu mới vào MongoDB
    for (const row of response.items) {
        try {
            const newData = new DataModel({
                rowId: row.id,
                rowName: row.name,
                values: row.values
            });

            await newData.save();
            console.log(`Đã lưu dữ liệu cho hàng: ${row.id}`);
        } catch (error) {
            console.error('Lỗi khi lưu dữ liệu:', error);
        }
    }
}

// API Handler cho việc làm mới dữ liệu từ Coda
export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            await fetchDataAndSave();
            res.status(200).send('Dữ liệu đã được làm mới thành công');
        } catch (err) {
            res.status(500).send('Lỗi khi làm mới dữ liệu');
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
