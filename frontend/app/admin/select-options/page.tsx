'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import type { SelectOption } from '@/types/admin';
import { InfiniteScrollFooter } from '@/components/ui/InfiniteScrollFooter';
import { useInfiniteList } from '@/hooks/useInfiniteList';
import { normalizeFlatPage } from '@/lib/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Modal ──────────────────────────────────────────────────────────────────────
interface OptionForm { group_key: string; value: string; label: string; sort_order: string; parent_id: string; is_active: boolean; }

function OptionFormModal({
    open, initial, onClose, onSave, saving,
}: {
    open: boolean;
    initial?: Partial<OptionForm>;
    onClose: () => void;
    onSave: (data: OptionForm) => void;
    saving: boolean;
}) {
    const [form, setForm] = useState<OptionForm>({
        group_key: initial?.group_key ?? '',
        value: initial?.value ?? '',
        label: initial?.label ?? '',
        sort_order: initial?.sort_order ?? '0',
        parent_id: initial?.parent_id ?? '',
        is_active: initial?.is_active ?? true,
    });

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <h3 className="font-semibold text-gray-900 mb-4">{initial?.value ? 'Edit Option' : 'Add Option'}</h3>
                <div className="space-y-3">
                    <div>
                        <Label className="text-xs text-[#3D3220] mb-1 block">Group Key *</Label>
                        <Input value={form.group_key} onChange={e => setForm(f => ({ ...f, group_key: e.target.value }))} placeholder="e.g. religion, diet, country" className="border-gray-200"/>
                    </div>
                    <div>
                        <Label className="text-xs text-[#3D3220] mb-1 block">Value * <span className="text-[#4A3F2E]">(machine key, lowercase_underscore)</span></Label>
                        <Input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="e.g. islam, non_vegetarian" className="border-gray-200"/>
                    </div>
                    <div>
                        <Label className="text-xs text-[#3D3220] mb-1 block">Label * <span className="text-[#4A3F2E]">(shown in dropdown)</span></Label>
                        <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Islam, Non-Vegetarian" className="border-gray-200"/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs text-[#3D3220] mb-1 block">Parent ID</Label>
                            <Input value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))} placeholder="Leave empty for top-level" type="number" className="border-gray-200"/>
                        </div>
                        <div>
                            <Label className="text-xs text-[#3D3220] mb-1 block">Sort Order</Label>
                            <Input value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} type="number" className="border-gray-200"/>
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                        <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-amber-500"/>
                        Active (visible in dropdowns)
                    </label>
                </div>
                <div className="flex gap-3 mt-5">
                    <Button
                        onClick={() => onSave(form)}
                        disabled={saving || !form.group_key || !form.value || !form.label}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </Button>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminSelectOptionsPage() {
    const queryClient = useQueryClient();
    const [groupFilter, setGroupFilter] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editOption, setEditOption] = useState<SelectOption | null>(null);

    const { data: groupsRes } = useQuery({
        queryKey: ['admin-select-option-groups'],
        queryFn: () => adminService.getSelectOptionGroups().then(r => r.data),
    });
    const groups: string[] = groupsRes?.data ?? groupsRes ?? [];

    const {
        items: options,
        total,
        isLoading,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteList<SelectOption>({
        queryKey: ['admin-select-options', groupFilter],
        queryFn: (page) =>
            adminService.getSelectOptions({ group_key: groupFilter || undefined, page }).then((r) => normalizeFlatPage(r.data.data, page)),
    });

    const createMutation = useMutation({
        mutationFn: (data: {
            group_key: string; value: string; label: string;
            sort_order?: number; parent_id?: number | null; is_active?: boolean;
        }) => adminService.createSelectOption(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-select-options'] });
            queryClient.invalidateQueries({ queryKey: ['admin-select-option-groups'] });
            setShowAddModal(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Parameters<typeof adminService.updateSelectOption>[1] }) =>
            adminService.updateSelectOption(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-select-options'] });
            setEditOption(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminService.deleteSelectOption(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-select-options'] }),
    });

    const toggleMutation = useMutation({
        mutationFn: (id: number) => adminService.toggleSelectOption(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-select-options'] }),
    });

    const handleSave = (form: { group_key: string; value: string; label: string; sort_order: string; parent_id: string; is_active: boolean }) => {
        const payload = {
            group_key: form.group_key.trim(),
            value: form.value.trim().toLowerCase().replace(/\s+/g, '_'),
            label: form.label.trim(),
            sort_order: form.sort_order ? Number(form.sort_order) : 0,
            parent_id: form.parent_id ? Number(form.parent_id) : null,
            is_active: form.is_active,
        };
        if (editOption) {
            updateMutation.mutate({ id: editOption.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Select Options</h1>
                    <p className="text-sm text-meta mt-0.5">Manage all dynamic dropdown options for profile forms</p>
                </div>
                <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                >
                    + Add Option
                </Button>
            </div>

            {/* Group filter */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setGroupFilter('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!groupFilter ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-[#3D3220] hover:bg-gray-100'}`}
                >
                    All Groups
                </button>
                {(Array.isArray(groups) ? groups : []).map(g => (
                    <button
                        key={g}
                        onClick={() => setGroupFilter(g)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${groupFilter === g ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-[#3D3220] hover:bg-gray-100'}`}
                    >
                        {g.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-[#4A3F2E]">Loading…</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Group</th>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Value</th>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Label</th>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Parent ID</th>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Sort</th>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Children</th>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {options.map(opt => (
                                    <tr key={opt.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-2.5">
                                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-mono">
                                                {opt.group_key}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-xs text-[#3D3220]">{opt.value}</td>
                                        <td className="px-4 py-2.5 text-gray-900">{opt.label}</td>
                                        <td className="px-4 py-2.5 text-[#4A3F2E] text-xs">{opt.parent_id ?? '—'}</td>
                                        <td className="px-4 py-2.5 text-[#4A3F2E] text-xs">{opt.sort_order}</td>
                                        <td className="px-4 py-2.5">
                                            <button
                                                onClick={() => toggleMutation.mutate(opt.id)}
                                                disabled={toggleMutation.isPending}
                                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${opt.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-meta hover:bg-gray-200'}`}
                                            >
                                                {opt.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-2.5 text-[#4A3F2E] text-xs">
                                            {opt.children?.length ?? 0}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => setEditOption(opt)}
                                                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`Delete "${opt.label}"? All children will also be deleted.`)) {
                                                            deleteMutation.mutate(opt.id);
                                                        }
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {options.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-[#4A3F2E]">
                                            No options found.{' '}
                                            {groupFilter && <button className="text-amber-600 underline" onClick={() => setGroupFilter('')}>Clear filter</button>}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && options.length > 0 && (
                    <InfiniteScrollFooter
                        hasNextPage={!!hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onLoadMore={() => fetchNextPage()}
                        showEndMessage
                        endMessage={`No more options${total > 0 ? ` · ${total} total` : ''}`}
                        className="border-t border-gray-100"
                    />
                )}
            </div>

            {/* Add modal */}
            <OptionFormModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleSave}
                saving={createMutation.isPending}
            />

            {/* Edit modal */}
            {editOption && (
                <OptionFormModal
                    open={true}
                    initial={{
                        group_key: editOption.group_key,
                        value: editOption.value,
                        label: editOption.label,
                        sort_order: String(editOption.sort_order),
                        parent_id: editOption.parent_id ? String(editOption.parent_id) : '',
                        is_active: editOption.is_active,
                    }}
                    onClose={() => setEditOption(null)}
                    onSave={handleSave}
                    saving={updateMutation.isPending}
                />
            )}
        </div>
    );
}

