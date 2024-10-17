// Import các thư viện cần thiết
import mongoose from 'mongoose';
import { DataModel } from '../../models/CodaData.js';
import dotenv from 'dotenv';
dotenv.config();

// API Handler cho việc lấy, thêm và xóa dữ liệu
export default async function handler(req, res) {
    const { method } = req;

    switch (method) {
        case 'GET':
            try {
                const data = await DataModel.find();
                res.status(200).json(data);
            } catch (err) {
                res.status(500).send('Lỗi khi lấy dữ liệu từ MongoDB');
            }
            break;
        case 'POST':
            try {
                const { rowId, rowName, values } = req.body;
                const newData = new DataModel({ rowId, rowName, values });
                await newData.save();
                res.status(201).json(newData);
            } catch (err) {
                res.status(500).send('Lỗi khi thêm dữ liệu vào MongoDB');
            }
            break;
        case 'DELETE':
            try {
                const { id } = req.query;
                await DataModel.findByIdAndDelete(id);
                res.status(200).send('Đã xóa dữ liệu thành công');
            } catch (err) {
                res.status(500).send('Lỗi khi xóa dữ liệu');
            }
            break;
        default:
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}
