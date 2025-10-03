// Serverless API for managing products using Vercel Blob storage
// Requires the env var BLOB_READ_WRITE_TOKEN on Vercel for write access

import { put, list } from '@vercel/blob';

const BLOB_NAME = 'products.json';

async function readProductsFromBlob() {
  try {
    const { blobs } = await list({ prefix: BLOB_NAME });
    const match = blobs.find(b => b.pathname === BLOB_NAME);
    if (!match) return [];
    const res = await fetch(match.url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

async function writeProductsToBlob(products) {
  const json = JSON.stringify(products);
  await put(BLOB_NAME, json, {
    contentType: 'application/json',
    access: 'public',
    addRandomSuffix: false,
  });
}

export default async function handler(req, res) {
  // Enable CORS for local testing and flexibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const products = await readProductsFromBlob();
      return res.status(200).json(products);
    }

    const products = await readProductsFromBlob();

    if (req.method === 'POST') {
      const body = req.body || {};
      if (!body.name || !body.price || !body.category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const newProduct = {
        id: Date.now().toString(),
        name: body.name,
        price: Number(body.price),
        offerPrice: body.offerPrice ? Number(body.offerPrice) : undefined,
        images: Array.isArray(body.images) ? body.images : [],
        category: String(body.category),
        description: String(body.description || ''),
        stock: Number.isFinite(body.stock) ? Number(body.stock) : 0,
      };
      const next = [...products, newProduct];
      await writeProductsToBlob(next);
      return res.status(201).json(newProduct);
    }

    if (req.method === 'PUT') {
      const { id, updates } = req.body || {};
      if (!id || typeof updates !== 'object') {
        return res.status(400).json({ error: 'id and updates are required' });
      }
      const idx = products.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Not found' });
      const updated = { ...products[idx], ...updates };
      const next = [...products];
      next[idx] = updated;
      await writeProductsToBlob(next);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const next = products.filter(p => p.id !== id);
      await writeProductsToBlob(next);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    const message = err && err.message ? err.message : 'Internal Error';
    return res.status(500).json({ error: message });
  }
}


