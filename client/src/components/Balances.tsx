import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard,
    Plus,
    History,
    DollarSign,
    Calendar,
    CheckCircle,
    Clock
} from 'lucide-react';
import { Balance, BalanceTransaction } from '../types/index';
import { Button } from './Button';

interface BalancesProps {
    balances: Balance[];
    transactions: BalanceTransaction[];
    onAddBalance?: () => void;
    onViewTransactions?: (balanceId: string) => void;
}

export const Balances: React.FC<BalancesProps> = ({
    balances,
    transactions,
    onAddBalance,
    onViewTransactions
}) => {
    const [selectedBalance, setSelectedBalance] = useState<string | null>(null);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getBalanceTypeIcon = (type: Balance['type']) => {
        switch (type) {
            case 'credit':
                return <DollarSign className="w-4 h-4" />;
            case 'subscription':
                return <Calendar className="w-4 h-4" />;
            case 'premium':
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <CreditCard className="w-4 h-4" />;
        }
    };

    const getBalanceTypeColor = (type: Balance['type']) => {
        switch (type) {
            case 'credit':
                return 'text-green-600 bg-green-50';
            case 'subscription':
                return 'text-blue-600 bg-blue-50';
            case 'premium':
                return 'text-purple-600 bg-purple-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getTransactionIcon = (type: BalanceTransaction['type']) => {
        switch (type) {
            case 'credit':
                return <Plus className="w-3 h-3 text-green-600" />;
            case 'debit':
                return <DollarSign className="w-3 h-3 text-red-600" />;
            case 'refund':
                return <CheckCircle className="w-3 h-3 text-blue-600" />;
            default:
                return <Clock className="w-3 h-3 text-gray-600" />;
        }
    };

    const filteredTransactions = selectedBalance
        ? transactions.filter(t => t.balanceId === selectedBalance)
        : transactions;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Balances</h2>
                {onAddBalance && (
                    <Button
                        onClick={onAddBalance}
                        icon={<Plus className="w-4 h-4" />}
                    >
                        Add Balance
                    </Button>
                )}
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {balances.map((balance) => (
                    <motion.div
                        key={balance.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${selectedBalance === balance.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        onClick={() => setSelectedBalance(
                            selectedBalance === balance.id ? null : balance.id
                        )}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getBalanceTypeColor(balance.type)}`}>
                                {getBalanceTypeIcon(balance.type)}
                                {balance.type}
                            </div>
                            <div className={`w-3 h-3 rounded-full ${balance.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {balance.name}
                        </h3>

                        <div className="text-2xl font-bold text-gray-900 mb-4">
                            {formatCurrency(balance.amount, balance.currency)}
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Created:</span>
                                <span>{formatDate(balance.createdAt)}</span>
                            </div>
                            {balance.expiresAt && (
                                <div className="flex justify-between">
                                    <span>Expires:</span>
                                    <span>{formatDate(balance.expiresAt)}</span>
                                </div>
                            )}
                        </div>

                        {onViewTransactions && (
                            <Button
                                size="sm"
                                variant="secondary"
                                className="w-full mt-4"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewTransactions(balance.id);
                                }}
                                icon={<History className="w-3 h-3" />}
                            >
                                View Transactions
                            </Button>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Transactions */}
            {filteredTransactions.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {selectedBalance ? 'Balance Transactions' : 'All Transactions'}
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {filteredTransactions.slice(0, 10).map((transaction) => (
                            <div key={transaction.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getTransactionIcon(transaction.type)}
                                    <div>
                                        <div className="font-medium text-gray-800">
                                            {transaction.description}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(transaction.createdAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className={`font-semibold ${transaction.type === 'credit' || transaction.type === 'refund'
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                    }`}>
                                    {transaction.type === 'debit' ? '-' : '+'}
                                    ${transaction.amount.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {balances.length === 0 && (
                <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        No balances found
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Add your first balance to get started with premium features.
                    </p>
                    {onAddBalance && (
                        <Button onClick={onAddBalance} icon={<Plus className="w-4 h-4" />}>
                            Add Balance
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};