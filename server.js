// Import các thư viện cần thiết
import express from 'express';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import cron from 'node-cron';
import cors from 'cors';
import { DataModel } from './model/CodaData.js';

// Khởi tạo ứng dụng Express
const app = express();
const port = process.env.PORT || 5000;

// Middleware CORS để cho phép các yêu cầu từ frontend
app.use(cors());
app.use(express.json());

// Kết nối tới MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/data-webclient';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Kết nối MongoDB thành công');
}).catch(err => {
    console.error('Lỗi kết nối MongoDB:', err);
});

// API để lấy tất cả dữ liệu từ MongoDB
app.get('/api/data', async (req, res) => {
    try {
        const data = await DataModel.find();
        res.json(data);
    } catch (err) {
        res.status(500).send('Lỗi khi lấy dữ liệu từ MongoDB');
    }
});

// API để thêm mới dữ liệu vào MongoDB
app.post('/api/data', async (req, res) => {
    try {
        const { rowId, rowName, values } = req.body;
        const newData = new DataModel({ rowId, rowName, values });
        await newData.save();
        res.status(201).json(newData);
    } catch (err) {
        res.status(500).send('Lỗi khi thêm dữ liệu vào MongoDB');
    }
});

// API để xóa dữ liệu theo ID
app.delete('/api/data/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await DataModel.findByIdAndDelete(id);
        res.status(200).send('Đã xóa dữ liệu thành công');
    } catch (err) {
        res.status(500).send('Lỗi khi xóa dữ liệu');
    }
});

// Hàm lấy và lưu dữ liệu từ API Coda
async function fetchDataAndSave() {
    const apiToken = process.env.CODA_API_TOKEN || 'e37f2e4c-4a92-448c-86f3-8cad58a80c0a'; // Thay bằng mã API Coda của bạn

    const mydata = await fetch("https://coda.io/apis/v1/docs/7sk4ZtS6kG/tables/table-rDuaevjmdx/rows", {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!mydata.ok) {
        console.error('Lỗi khi lấy dữ liệu:', mydata.status, mydata.statusText);
        return;
    }

    const response = await mydata.json();

    // Xóa dữ liệu cũ trong MongoDB
    await DataModel.deleteMany({});
    console.log('Đã xóa dữ liệu cũ');

    // Lặp qua từng hàng và lưu dữ liệu mới vào MongoDB
    response.items.forEach(async row => {
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
    });
}

// API để làm mới dữ liệu từ Coda
app.post('/api/refresh-data', async (req, res) => {
    try {
        await fetchDataAndSave();
        res.status(200).send('Dữ liệu đã được làm mới thành công');
    } catch (err) {
        res.status(500).send('Lỗi khi làm mới dữ liệu');
    }
});

// Lập lịch thực hiện công việc mỗi 24 giờ
cron.schedule('0 0 * * *', () => {
    console.log('Thực hiện làm mới dữ liệu lúc', new Date().toLocaleString());
    fetchDataAndSave();
});

// Khởi chạy server
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});
