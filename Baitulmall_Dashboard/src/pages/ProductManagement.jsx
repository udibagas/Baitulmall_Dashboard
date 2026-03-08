import React, { useState, useEffect, useRef } from 'react';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../services/productApi';
import { fetchRTs } from '../services/asnafApi';
import {
    Plus, Search, Edit2, Trash2, X as XIcon,
    Upload, MapPin, ShoppingBag, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

const ProductManagement = () => {
    // State
    const [products, setProducts] = useState([]);
    const [rts, setRts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Kuliner',
        seller_name: '',
        seller_phone: '',
        rt_id: '1',
        maps_link: '',
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const categories = ['Kuliner', 'Kerajinan', 'Jasa', 'Lainnya'];

    // Initial Load
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsRes, rtsRes] = await Promise.all([
                fetchProducts({ limit: 100 }),
                fetchRTs()
            ]);

            setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
            setRts(Array.isArray(rtsRes) ? rtsRes : (rtsRes.data || []));
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description || '');
            data.append('price', formData.price);
            data.append('category', formData.category);
            data.append('seller_name', formData.seller_name);
            data.append('seller_phone', formData.seller_phone);
            data.append('rt_id', formData.rt_id);
            data.append('maps_link', formData.maps_link || '');

            if (formData.image) {
                data.append('image', formData.image);
            }

            if (editId) {
                await updateProduct(editId, data);
                alert('Produk berhasil diperbarui!');
            } else {
                await createProduct(data);
                alert('Produk berhasil ditambahkan!');
            }

            closeModal();
            loadData();
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan data: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (item) => {
        setEditId(item.id);
        const currentRt = rts.find(r => r.id === item.rt_id || r.kode === item.rt?.kode);

        setFormData({
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            seller_name: item.seller_name,
            seller_phone: item.seller_phone,
            rt_id: currentRt ? currentRt.id : (item.rt_id || '1'),
            maps_link: item.maps_link,
            image: null
        });
        setImagePreview(item.image_url);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus produk ini?')) {
            try {
                await deleteProduct(id);
                setProducts(prev => prev.filter(p => p.id !== id));
            } catch (error) {
                alert('Gagal menghapus produk');
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditId(null);
        setFormData({
            name: '', description: '', price: '', category: 'Kuliner',
            seller_name: '', seller_phone: '', rt_id: '1', maps_link: '', image: null
        });
        setImagePreview(null);
    };

    // Filter
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.seller_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="glass-card mb-8 p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 text-[var(--text-main)] mb-1">
                        <ShoppingBag className="text-[var(--primary)]" size={32} />
                        Manajemen Produk UMKM
                    </h1>
                    <p className="text-[var(--text-muted)]">Kelola data produk etalase binaan Baitulmal.</p>
                </div>
                <button
                    onClick={() => { setShowModal(true); setEditId(null); }}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={20} /> Tambah Produk
                </button>
            </div>

            <div className="glass-card p-4 mb-6 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input
                        className="input w-full pl-10"
                        placeholder="Cari nama produk atau penjual..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Gambar</th>
                                <th>Nama Produk</th>
                                <th>Kategori</th>
                                <th>Harga</th>
                                <th>Penjual</th>
                                <th>Lokasi</th>
                                <th className="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="text-center p-8">Loading...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="7" className="text-center p-8 text-[var(--text-muted)]">Belum ada data produk.</td></tr>
                            ) : (
                                filteredProducts.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="w-12 h-12 rounded-lg bg-[var(--background)] overflow-hidden border border-[var(--border-color)]">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                                                        <ImageIcon size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-bold text-[var(--text-main)]">{item.name}</div>
                                            <div className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">{item.description}</div>
                                        </td>
                                        <td><span className="badge bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-muted)]">{item.category}</span></td>
                                        <td className="font-mono">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                                        <td>
                                            <div className="text-sm font-semibold">{item.seller_name}</div>
                                            <div className="text-xs text-[var(--text-muted)]">{item.seller_phone}</div>
                                        </td>
                                        <td>
                                            {item.maps_link ? (
                                                <a href={item.maps_link} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline flex items-center gap-1 text-xs">
                                                    <MapPin size={12} /> Buka Peta
                                                </a>
                                            ) : <span className="text-[var(--text-muted)] text-xs">-</span>}
                                        </td>
                                        <td>
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleEdit(item)} className="btn btn-ghost p-2 text-[var(--info)] hover:bg-[var(--background)] rounded-lg" title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="btn btn-ghost p-2 text-[var(--danger)] hover:bg-[var(--background)] rounded-lg" title="Hapus">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-fade-in custom-scrollbar">
                        <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)] sticky top-0 bg-[var(--card-bg)]/95 backdrop-blur z-10">
                            <h3 className="text-lg font-bold text-[var(--text-main)]">
                                {editId ? 'Edit Produk' : 'Tambah Produk Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                                <XIcon size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Image Upload Section */}
                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--background)]/50 hover:bg-[var(--background)] transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {imagePreview ? (
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden group">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white font-medium flex items-center gap-2"><Upload size={18} /> Ganti Gambar</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto mb-3">
                                            <ImageIcon size={32} />
                                        </div>
                                        <p className="font-medium text-[var(--text-main)]">Klik untuk upload gambar produk</p>
                                        <p className="text-sm text-[var(--text-muted)] mt-1">Format: JPG, PNG (Max 2MB)</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-[var(--text-muted)] mb-1 block">Nama Produk <span className="text-red-500">*</span></label>
                                        <input className="input w-full" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Contoh: Keripik Pisang" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-[var(--text-muted)] mb-1 block">Harga (Rp) <span className="text-red-500">*</span></label>
                                        <input type="number" className="input w-full" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-[var(--text-muted)] mb-1 block">Kategori <span className="text-red-500">*</span></label>
                                        <select className="input w-full" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-[var(--text-muted)] mb-1 block">Nama Penjual <span className="text-red-500">*</span></label>
                                        <input className="input w-full" required value={formData.seller_name} onChange={e => setFormData({ ...formData, seller_name: e.target.value })} placeholder="Nama warga binaan" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-[var(--text-muted)] mb-1 block">No. WhatsApp <span className="text-red-500">*</span></label>
                                        <input className="input w-full" required value={formData.seller_phone} onChange={e => setFormData({ ...formData, seller_phone: e.target.value })} placeholder="628123xxxx" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-[var(--text-muted)] mb-1 block">Wilayah RT <span className="text-red-500">*</span></label>
                                        <select className="input w-full" value={formData.rt_id} onChange={e => setFormData({ ...formData, rt_id: e.target.value })}>
                                            {rts.map(rt => <option key={rt.id} value={rt.id}>RT {rt.kode}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-[var(--text-muted)] mb-1 block flex items-center gap-2">
                                    <MapPin size={14} className="text-[var(--danger)]" /> Link Google Maps
                                </label>
                                <input
                                    className="input w-full"
                                    value={formData.maps_link}
                                    onChange={e => setFormData({ ...formData, maps_link: e.target.value })}
                                    placeholder="https://maps.app.goo.gl/..."
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">Paste link dari 'Share Location' Google Maps disini.</p>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-[var(--text-muted)] mb-1 block flex items-center justify-between">
                                    <span>Deskripsi Produk (Opsional)</span>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!formData.name || !formData.category) {
                                                alert('Mohon isi Nama Produk dan Kategori terlebih dahulu.');
                                                return;
                                            }
                                            try {
                                                // Simple loading state for this button specifically could be added,
                                                // but for now we'll reuse a global or local state if we want better UX.
                                                // Let's use a temporary text change or something.
                                                const originalText = formData.description;
                                                setFormData(prev => ({ ...prev, description: 'Sedang membuat deskripsi dengan AI...' }));

                                                const token = localStorage.getItem('token'); // Assuming auth token needed
                                                // Need to import axios or use fetch. The existing code uses 'productApi' services.
                                                // We should probably add this to the api service, but for quick implementation:
                                                const response = await fetch('http://localhost:8000/v1/ai/generate-description', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({
                                                        name: formData.name,
                                                        category: formData.category
                                                    })
                                                });
                                                const data = await response.json();
                                                if (data.description) {
                                                    setFormData(prev => ({ ...prev, description: data.description }));
                                                } else {
                                                    alert('Gagal membuat deskripsi.');
                                                    setFormData(prev => ({ ...prev, description: originalText }));
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                alert('Terjadi kesalahan saat menghubungi AI.');
                                            }
                                        }}
                                        className="text-xs flex items-center gap-1 text-[var(--info)] hover:underline"
                                    >
                                        ✨ Buat Deskripsi Otomatis (AI)
                                    </button>
                                </label>
                                <textarea
                                    className="input w-full h-24 resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Jelaskan detail produk..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                                <button type="button" onClick={closeModal} className="btn btn-ghost border border-[var(--border-color)]">Batal</button>
                                <button type="submit" disabled={isSaving} className="btn btn-primary min-w-[120px]">
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Simpan Produk'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;
