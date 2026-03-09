import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    RefreshCw,
    ToggleLeft,
    ToggleRight,
    Code,
    Loader2,
    Building2,
    Wallet,
    Palette,
    Settings as SettingsIcon,
    Save,
    CheckCircle,
    Info,
    PenTool,
    Shield
} from 'lucide-react';
import SignatureManager from '../components/SignatureManager';

import { fetchSettings, createSetting, updateSetting, deleteSetting } from '../services/settingApi';
import { fetchUsers, updateUserRole, updateUser, deleteUser } from '../services/userApi';
import { fetchRoles, createRole, updateRole, deleteRole } from '../services/roleApi';
import SettingFormModal from '../components/Modals/SettingFormModal';
import UserManagementModal from '../components/Modals/UserManagementModal';
import RoleFormModal from '../components/Modals/RoleFormModal';
import { useRole, ROLES } from '../contexts/RoleContext';

const SettingPage = () => {
    // State Management
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [modal, setModal] = useState({ open: false, data: null });
    const [activeTab, setActiveTab] = useState('profil');
    const [saveStatus, setSaveStatus] = useState(null);
    const { currentRole, refreshUser, hasPermission } = useRole();

    // Role Management State
    const [roles, setRoles] = useState([]);
    const [roleLoading, setRoleLoading] = useState(false);
    const [roleModal, setRoleModal] = useState({ open: false, data: null });

    // User Management State
    const [users, setUsers] = useState([]);
    const [userLoading, setUserLoading] = useState(false);
    const [userModal, setUserModal] = useState({ open: false, data: null });

    // Theme state (Sync with UserPreference)
    const [cardTheme, setCardTheme] = useState(() => localStorage.getItem('cardTheme') || 'slate-dark-pro');

    // Load Data
    const loadSettings = async () => {
        try {
            setLoading(true);
            const res = await fetchSettings();
            if (res.success) {
                setSettings(res.data || []);
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            setUserLoading(true);
            const res = await fetchUsers(); // Handle pagination if needed later
            if (res.success) {
                setUsers(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setUserLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (activeTab === 'pengguna') {
            loadUsers();
        }
        if (activeTab === 'role') {
            loadRoles();
        }
    }, [activeTab]);

    const loadRoles = async () => {
        try {
            setRoleLoading(true);
            const res = await fetchRoles();
            if (res.success) {
                setRoles(res.data || []);
            }
        } catch (err) {
            console.error('Failed to load roles:', err);
        } finally {
            setRoleLoading(false);
        }
    };

    // Theme effect
    useEffect(() => {
        localStorage.setItem('cardTheme', cardTheme);
        document.documentElement.setAttribute('data-theme', cardTheme);
    }, [cardTheme]);

    // Helper to get setting value by key
    const getVal = (key, defaultVal = '') => {
        const item = settings.find(s => s.key_name === key);
        return item ? item.value : defaultVal;
    };

    const handleSaveStatus = (status) => {
        setSaveStatus(status);
        setTimeout(() => setSaveStatus(null), 3000);
    };

    // Generic Quick Save
    const quickSave = async (key, value, type = 'string', description = '') => {
        setSubmitting(true);
        try {
            const existing = settings.find(s => s.key_name === key);
            if (existing) {
                await updateSetting(existing.id, { key_name: key, value: String(value), type, description });
            } else {
                await createSetting({ key_name: key, value: String(value), type, description });
            }
            await loadSettings();
            handleSaveStatus('success');
        } catch (err) {
            console.error('Failed to save:', err);
            handleSaveStatus('error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSave = async (formData) => {
        setSubmitting(true);
        try {
            if (modal.data) {
                await updateSetting(modal.data.id, formData);
            } else {
                await createSetting(formData);
            }
            setModal({ open: false, data: null });
            await loadSettings();
            handleSaveStatus('success');
        } catch (err) {
            console.error('Failed to save:', err);
            alert('Gagal menyimpan setting: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveProfileConfig = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const keysToSave = [
                { key: 'org_name', type: 'string', label: 'Nama Institusi Utama', default: 'Baitulmal Fajar Maqbul' },
                { key: 'org_address', type: 'string', label: 'Alamat Lengkap Kantor', default: 'Jl. Kandri, Semarang, Jawa Tengah' },
                { key: 'org_phone', type: 'string', label: 'Nomor Kontak Utama', default: '08123456789' },
                { key: 'org_email', type: 'string', label: 'Email Kontak Resmi', default: 'info@baitulmal.com' }
            ];

            for (const item of keysToSave) {
                const val = configData[item.key] || item.default;
                const existing = settings.find(s => s.key_name === item.key);

                if (existing) {
                    if (existing.value !== String(val)) {
                        await updateSetting(existing.id, {
                            key_name: item.key,
                            value: String(val),
                            type: item.type,
                            description: item.label
                        });
                    }
                } else {
                    await createSetting({
                        key_name: item.key,
                        value: String(val),
                        type: item.type,
                        description: item.label
                    });
                }
            }

            await loadSettings();
            alert('Profil Baitulmal berhasil disimpan!');
        } catch (err) {
            console.error('Failed to save profile config:', err);
            alert('Gagal menyimpan profil: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };



    // User CRUD Handlers
    const handleSaveUserCredentials = async (userId, data) => {
        setSubmitting(true);
        try {
            await updateUser(userId, data);
            setUserModal({ open: false, data: null });
            await loadUsers();
            alert('Data pengguna berhasil diperbarui!');
        } catch (err) {
            console.error('Update user failed:', err);
            alert('Gagal update user: ' + (err.message || 'Error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Hapus user ${user.name}? Tindakan ini tidak dapat dibatalkan.`)) return;

        setSubmitting(true);
        try {
            await deleteUser(user.id);
            await loadUsers();
            alert('User berhasil dihapus.');
        } catch (err) {
            console.error('Delete user failed:', err);
            alert('Gagal menghapus user: ' + (err.message || 'Error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus setting ini?')) return;
        try {
            await deleteSetting(id);
            await loadSettings();
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const handleToggleBoolean = async (setting) => {
        if (setting.type !== 'boolean') return;
        const newValue = (setting.value === 'true' || setting.value === '1') ? 'false' : 'true';
        try {
            await updateSetting(setting.id, { ...setting, value: newValue });
            await loadSettings();
        } catch (err) {
            console.error('Toggle failed:', err);
        }
    };

    const filteredSettings = settings.filter(s =>
        s.key_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const themes = [
        { id: 'pure-admin', name: 'Pure Admin', desc: 'Standard solid structure' },
        { id: 'slate-dark-pro', name: 'Slate Dark Pro', desc: 'Modern & Deep Dark Mode' },
        { id: 'baitulmal-calm', name: 'Baitulmal Tenang', desc: 'Tenang, modern ringan, bersih – nyaman di mata' },
        { id: 'charcoal-mix', name: 'Charcoal Mix', desc: 'Elegant dark theme with deep charcoal tones' },
    ];

    // Local state for configuration forms
    const [configData, setConfigData] = useState({});

    // Populate configData when settings are loaded
    useEffect(() => {
        if (settings.length > 0) {
            const initialData = {};
            settings.forEach(s => {
                initialData[s.key_name] = s.value;
            });
            setConfigData(prev => ({ ...prev, ...initialData }));
        }
    }, [settings]);

    const handleConfigChange = (key, value) => {
        setConfigData(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveConfig = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            // Define keys to save for the current active tab (Keuangan)
            const keysToSave = [
                { key: 'zakat_rice_price', type: 'number', label: 'Harga Beras', default: '15000' },
                { key: 'zakat_fitrah_kgs', type: 'number', label: 'Besaran Zakat Fitrah', default: '2.5' },
                { key: 'nisab_zakat_mall', type: 'number', label: 'Nisab Zakat Mal', default: '85000000' }
            ];

            for (const item of keysToSave) {
                const val = configData[item.key] || item.default;
                const existing = settings.find(s => s.key_name === item.key);

                if (existing) {
                    if (existing.value !== String(val)) {
                        await updateSetting(existing.id, {
                            key_name: item.key,
                            value: String(val),
                            type: item.type,
                            description: item.label
                        });
                    }
                } else {
                    await createSetting({
                        key_name: item.key,
                        value: String(val),
                        type: item.type,
                        description: item.label
                    });
                }
            }

            await loadSettings(); // Refresh master data
            handleSaveStatus('success');
            alert('Konfigurasi berhasil disimpan!');
        } catch (err) {
            console.error('Failed to save config:', err);
            handleSaveStatus('error');
            alert('Gagal menyimpan perubahan.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveUserRole = async (userId, data) => {
        setSubmitting(true);
        try {
            await updateUserRole(userId, data);
            setUserModal({ open: false, data: null });
            await loadUsers();
            alert('Role pengguna berhasil diperbarui!');
        } catch (err) {
            console.error('Update role failed:', err);
            alert('Gagal memperbarui role: ' + (err.message || 'Error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveRole = async (formData) => {
        setSubmitting(true);
        try {
            if (roleModal.data) {
                await updateRole(roleModal.data.id, formData);
            } else {
                await createRole(formData);
            }
            setRoleModal({ open: false, data: null });
            await loadRoles();
            await refreshUser();
            handleSaveStatus('success');
        } catch (err) {
            console.error('Failed to save role:', err);
            alert('Gagal menyimpan role: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteRole = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus role ini?')) return;
        try {
            await deleteRole(id);
            await loadRoles();
        } catch (err) {
            console.error('Failed to delete role:', err);
        }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
            <div className="mb-4">
                <h2 style={{ fontWeight: 800, margin: 0, fontSize: '1.75rem', color: 'var(--text-main)' }}>Pengaturan</h2>
                <p className="text-muted">Konfigurasi profile, keuangan, dan tampilan sistem Baitulmal</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
                {/* Sidebar Navigation */}
                <div className="flex flex-col gap-2">
                    {[
                        { id: 'profil', label: 'Profil Baitulmal', icon: <Building2 size={18} /> },
                        { id: 'keuangan', label: 'Konfigurasi Zakat', icon: <Wallet size={18} /> },
                        { id: 'pengguna', label: 'Manajemen Pengguna', icon: <SettingsIcon size={18} /> },
                        { id: 'role', label: 'Manajemen Role', icon: <Shield size={18} /> },
                        { id: 'tanda_tangan', label: 'Tanda Tangan', icon: <PenTool size={18} /> },
                        { id: 'tampilan', label: 'Tampilan Dashboard', icon: <Palette size={18} /> },
                        { id: 'sistem', label: 'Sistem (Advanced)', icon: <Code size={18} /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 text-left ${activeTab === tab.id
                                ? 'bg-blue-600 text-slate-200 shadow-lg shadow-blue-900/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}

                    {saveStatus === 'success' && (
                        <div className="mt-8 p-4 bg-green-500/10 text-green-500 rounded-xl text-sm flex items-center gap-2 border border-green-500/20">
                            <CheckCircle size={16} /> Berhasil disimpan
                        </div>
                    )}
                </div>

                {/* Content Area - Uses Theme Background */}
                <div className="rounded-[2.5rem] p-6 sm:p-10 min-h-[750px] shadow-2xl relative overflow-hidden flex flex-col"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)'
                    }}>
                    {/* Interior Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none"></div>
                    <div style={{ color: 'var(--text-main)' }}>
                        {activeTab === 'profil' && (
                            <div className="animate-slide-up space-y-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--text-main)' }}>
                                        <Building2 size={24} className="text-blue-500" /> Profil Baitulmal
                                    </h3>
                                    <button
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                                        onClick={() => handleSaveProfileConfig()}
                                        disabled={submitting}
                                    >
                                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Simpan Profil
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    <div className="form-group">
                                        <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Nama Institusi / Masjid</label>
                                        <input
                                            type="text"
                                            className="input w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            value={configData['org_name'] || ''}
                                            onChange={(e) => handleConfigChange('org_name', e.target.value)}
                                            placeholder="Baitulmal Fajar Maqbul"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Alamat Lengkap</label>
                                        <textarea
                                            rows={3}
                                            className="input w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            value={configData['org_address'] || ''}
                                            onChange={(e) => handleConfigChange('org_address', e.target.value)}
                                            placeholder="Jl. Kandri, Semarang, Jawa Tengah"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="text-slate-400 mb-2 block text-sm font-medium">Nomor Telepon/WA</label>
                                            <input
                                                type="text"
                                                className="input w-full"
                                                value={configData['org_phone'] || ''}
                                                onChange={(e) => handleConfigChange('org_phone', e.target.value)}
                                                placeholder="08123456789"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-slate-400 mb-2 block text-sm font-medium">Email Resmi</label>
                                            <input
                                                type="email"
                                                className="input w-full"
                                                value={configData['org_email'] || ''}
                                                onChange={(e) => handleConfigChange('org_email', e.target.value)}
                                                placeholder="info@baitulmal.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'keuangan' && (
                            <div className="animate-slide-up space-y-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold flex items-center gap-3 text-slate-200">
                                        <Wallet size={24} className="text-blue-500" /> Konfigurasi Zakat
                                    </h3>
                                    <button
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                                        onClick={handleSaveConfig}
                                        disabled={submitting}
                                    >
                                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Simpan Perubahan
                                    </button>
                                </div>

                                <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl flex gap-3 items-start">
                                    <Info size={20} className="text-blue-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-slate-400 leading-relaxed m-0">
                                        Nilai di bawah ini akan digunakan sebagai dasar perhitungan otomatis di halaman Zakat Fitrah dan Zakat Mal.
                                        Pastikan menekan tombol <strong className="text-blue-300">Simpan Perubahan</strong> setelah mengubah nilai.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="text-slate-400 mb-2 block text-sm font-medium">Harga Beras (Per KG)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-500 text-sm">Rp</span>
                                                <input
                                                    type="number"
                                                    className="input w-full pr-4 py-2.5"
                                                    style={{ paddingLeft: '3.5rem' }}
                                                    value={configData['zakat_rice_price'] || ''}
                                                    onChange={(e) => handleConfigChange('zakat_rice_price', e.target.value)}
                                                    placeholder="15000"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="text-slate-400 mb-2 block text-sm font-medium">Zakat Fitrah (Kg Beras/Jiwa)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="input w-full pl-4 py-2.5"
                                                    style={{ paddingRight: '3.5rem' }}
                                                    disabled={false}
                                                    step="0.01"
                                                    value={configData['zakat_fitrah_kgs'] || ''}
                                                    onChange={(e) => handleConfigChange('zakat_fitrah_kgs', e.target.value)}
                                                    placeholder="2.5"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-semibold text-slate-500 text-xs uppercase">KG</span>
                                            </div>
                                        </div>

                                    </div>
                                    <div className="form-group">
                                        <label className="text-slate-400 mb-2 block text-sm font-medium">Nisab Zakat Mal (Emas 85gr / Tahun)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-500 text-sm">Rp</span>
                                            <input
                                                type="number"
                                                className="input w-full pr-4 py-2.5" style={{ paddingLeft: '3.5rem' }}
                                                value={configData['nisab_zakat_mall'] || ''}
                                                onChange={(e) => handleConfigChange('nisab_zakat_mall', e.target.value)}
                                                placeholder="85000000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {
                            activeTab === 'tanda_tangan' && (
                                <div className="animate-slide-up">
                                    <SignatureManager />
                                </div>
                            )
                        }

                        {
                            activeTab === 'tampilan' && (
                                <div className="animate-slide-up space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold flex items-center gap-3 text-slate-200 mb-2">
                                            <Palette size={24} className="text-blue-500" /> Tampilan Dashboard
                                        </h3>
                                        <p className="text-slate-400">
                                            Sesuaikan tampilan antarmuka dasbor sesuai preferensi Anda.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {themes.map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setCardTheme(theme.id)}
                                                className={`p-6 rounded-2xl text-left cursor-pointer transition-all duration-200 border-2 flex flex-col gap-2 relative overflow-hidden ${cardTheme === theme.id
                                                    ? 'border-blue-500 bg-blue-900/10'
                                                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center w-full z-10">
                                                    <span className={`font-bold text-lg ${cardTheme === theme.id ? 'text-blue-400' : 'text-slate-200'}`}>
                                                        {theme.name}
                                                    </span>
                                                    {cardTheme === theme.id && <CheckCircle size={20} className="text-blue-500" />}
                                                </div>
                                                <span className="text-sm text-slate-500 z-10">{theme.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        }

                        {
                            activeTab === 'pengguna' && (
                                <div className="animate-slide-up space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--text-main)' }}>
                                            <SettingsIcon size={24} className="text-blue-500" /> Manajemen Penanggung Jawab
                                        </h3>
                                    </div>

                                    <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl flex gap-3 items-start mb-6">
                                        <Info size={20} className="text-blue-400 mt-0.5 shrink-0" />
                                        <p className="text-sm leading-relaxed m-0" style={{ color: 'var(--text-muted)' }}>
                                            Anda dapat mengubah email login, password, dan jabatan struktural untuk Bendahara, Koordinator RT, dan staff lainnya.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: 'var(--background)', border: '1px solid var(--border-color)' }}>
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-color)' }}>
                                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--table-header-text)' }}>Nama</th>
                                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--table-header-text)' }}>Email</th>
                                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--table-header-text)' }}>Role</th>
                                                    <th className="py-4 px-6 text-center text-[10px] font-black uppercase tracking-[0.2em] w-[100px]" style={{ color: 'var(--table-header-text)' }}>Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userLoading ? (
                                                    <tr><td colSpan="4" className="text-center py-8"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
                                                ) : users.length === 0 ? (
                                                    <tr><td colSpan="4" className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Tidak ada data pengguna</td></tr>
                                                ) : (
                                                    users.map(u => (
                                                        <tr key={u.id} className="transition-colors group" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                            <td className="py-4 px-6 align-middle font-medium transition-colors" style={{ color: 'var(--text-main)' }}>{u.name}</td>
                                                            <td className="py-4 px-6 align-middle transition-colors" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                                                            <td className="py-4 px-4 align-middle">
                                                                {u.person?.assignments?.filter(a => a.status === 'Aktif').map(a => (
                                                                    <span key={a.id} className="inline-block bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md text-xs font-bold mr-1 border border-blue-500/20">
                                                                        {a.jabatan}
                                                                    </span>
                                                                ))}
                                                            </td>
                                                            <td className="py-4 px-4 align-middle text-center">
                                                                <div className="flex justify-center gap-2">
                                                                    <button
                                                                        className="p-2 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                                        style={{ color: 'var(--text-muted)' }}
                                                                        onClick={() => setUserModal({ open: true, data: u })}
                                                                        title="Edit User"
                                                                    >
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                    <button
                                                                        className="p-2 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                        style={{ color: 'var(--text-muted)' }}
                                                                        onClick={() => handleDeleteUser(u)}
                                                                        title="Hapus User"
                                                                        disabled={submitting}
                                                                    >
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
                            )
                        }

                        {
                            activeTab === 'role' && (
                                <div className="animate-slide-up space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold flex items-center gap-3 text-slate-200">
                                            <Shield size={24} className="text-blue-500" /> Manajemen Role
                                        </h3>
                                        {(currentRole === ROLES.SUPER_ADMIN || hasPermission('manage_roles')) && (
                                            <button
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20"
                                                onClick={() => setRoleModal({ open: true, data: null })}
                                            >
                                                <Plus size={18} /> Role Baru
                                            </button>
                                        )}
                                    </div>

                                    <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl flex gap-3 items-start mb-6">
                                        <Info size={20} className="text-blue-400 mt-0.5 shrink-0" />
                                        <p className="text-sm text-slate-400 leading-relaxed m-0">
                                            Manajemen role digunakan untuk mendefinisikan tingkatan jabatan dan hak akses di sistem Baitulmal.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: 'var(--background)', border: '1px solid var(--border-color)' }}>
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-color)' }}>
                                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--table-header-text)' }}>Nama Role</th>
                                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--table-header-text)' }}>Deskripsi</th>
                                                    <th className="py-4 px-6 text-center text-[10px] font-black uppercase tracking-[0.2em] w-[120px]" style={{ color: 'var(--table-header-text)' }}>Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {roleLoading ? (
                                                    <tr><td colSpan="3" className="text-center py-8"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
                                                ) : roles.length === 0 ? (
                                                    <tr><td colSpan="3" className="text-center py-8 text-slate-500">Belum ada role yang dibuat.</td></tr>
                                                ) : (
                                                    roles.map(r => (
                                                        <tr key={r.id} className="border-b border-[#2d2d2d] hover:bg-[#121212] transition-colors group">
                                                            <td className="py-4 px-6 align-middle font-bold text-blue-400 group-hover:text-blue-300 transition-colors">{r.name}</td>
                                                            <td className="py-4 px-6 align-middle transition-colors" style={{ color: 'var(--text-muted)' }}>{r.description || '-'}</td>
                                                            <td className="py-4 px-4 align-middle text-center">
                                                                {(currentRole === ROLES.SUPER_ADMIN || hasPermission('manage_roles')) && (
                                                                    <div className="flex justify-center gap-2">
                                                                        <button
                                                                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                                            onClick={() => setRoleModal({ open: true, data: r })}
                                                                            title="Edit Role"
                                                                        >
                                                                            <Edit2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                            onClick={() => handleDeleteRole(r.id)}
                                                                            title="Hapus Role"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        }
                        {
                            activeTab === 'sistem' && (
                                <div className="animate-slide-up">
                                    <div className="d-flex align-items-center justify-content-between mb-4">
                                        <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2 m-0">
                                            <SettingsIcon size={24} className="text-blue-500" /> Pengaturan Sistem
                                        </h3>
                                        <div className="flex gap-2">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    className="input pl-9 pr-4 py-2 w-[200px]"
                                                    placeholder="Cari..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <button className="h-9 w-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors" onClick={() => setModal({ open: true, data: null })}>
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: 'var(--background)', border: '1px solid var(--border-color)' }}>
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-color)' }}>
                                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--table-header-text)' }}>Key</th>
                                                    <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--table-header-text)' }}>Value</th>
                                                    <th className="py-4 px-6 text-center text-[10px] font-black uppercase tracking-[0.2em] w-[100px]" style={{ color: 'var(--table-header-text)' }}>Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr><td colSpan="3" className="text-center py-8"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
                                                ) : filteredSettings.length === 0 ? (
                                                    <tr><td colSpan="3" className="text-center py-8 text-slate-500">Tidak ada data</td></tr>
                                                ) : (
                                                    filteredSettings.map(s => (
                                                        <tr key={s.id} className="border-b border-[#2d2d2d] hover:bg-[#121212] transition-colors group">
                                                            <td className="py-5 px-6 align-top">
                                                                <div className="flex flex-col">
                                                                    <code className="text-xs font-black transition-colors font-mono tracking-tighter uppercase" style={{ color: 'var(--danger)' }}>{s.key_name}</code>
                                                                    <span className="text-[9px] mt-1 uppercase font-black tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>{s.type}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-5 px-6 align-top">
                                                                {s.type === 'boolean' ? (
                                                                    <button onClick={() => handleToggleBoolean(s)} className="focus:outline-none transition-all hover:scale-110 active:scale-90">
                                                                        {(s.value === 'true' || s.value === '1')
                                                                            ? <ToggleRight size={32} className="text-emerald-500/80" />
                                                                            : <ToggleLeft size={32} className="text-slate-700" />
                                                                        }
                                                                    </button>
                                                                ) : (
                                                                    <div className="text-xs font-bold break-all leading-relaxed transition-colors" style={{ color: 'var(--text-muted)' }}>
                                                                        {s.value?.length > 60 ? s.value.substring(0, 60) + '...' : s.value}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-4 align-top text-center">
                                                                <div className="flex justify-center gap-2">
                                                                    <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" onClick={() => setModal({ open: true, data: s })}><Edit2 size={16} /></button>
                                                                    <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        }
                    </div>


                    <SettingFormModal
                        isOpen={modal.open}
                        onClose={() => setModal({ open: false, data: null })}
                        onSave={handleSave}
                        settingData={modal.data}
                        isSubmitting={submitting}
                    />

                    <UserManagementModal
                        isOpen={userModal.open}
                        onClose={() => setUserModal({ open: false, data: null })}
                        onSaveRole={handleSaveUserRole}
                        onSaveCredentials={handleSaveUserCredentials}
                        userData={userModal.data}
                        isSubmitting={submitting}
                    />

                    <RoleFormModal
                        key={roleModal.data?.id || 'new'}
                        isOpen={roleModal.open}
                        onClose={() => setRoleModal({ open: false, data: null })}
                        onSave={handleSaveRole}
                        initialData={roleModal.data}
                        isSubmitting={submitting}
                    />
                </div>
            </div>
        </div>
    );
};

export default SettingPage;

