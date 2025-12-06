/// <reference types="vite/client" />
import axios from 'axios';

// Development: Localhost
// Production (Vercel): Render Backend
const API_BASE_URL = import.meta.env.MODE === 'development'
    ? 'http://localhost:4000/api'
    : 'https://db-c2c-demo.onrender.com/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const endpoints = {
    items: '/items',
    categories: '/categories',
};
