'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, ArrowUpRight } from 'lucide-react';

export interface MetricProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  iconType: 'total' | 'progress' | 'overdue' | 'completion';
  index?: number;
}

export const MetricCard: React.FC<MetricProps> = ({
  title,
  value,
  change,
  changeType,
  iconType,
  index = 0,
}) => {
  const getIcon = () => {
    switch (iconType) {
      case 'total':
        return <CheckCircle2 className="w-5 h-5 text-[#5B82FF]" />;
      case 'progress':
        return <Clock className="w-5 h-5 text-[#5B82FF]" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-[#5B82FF]" />;
      case 'completion':
        return <TrendingUp className="w-5 h-5 text-[#5B82FF]" />;
    }
  };

  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#5B82FF]/40 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        {/* Rounded icon box */}
        <div className="w-10 h-10 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] flex items-center justify-center shadow-xs transition-colors">
          {getIcon()}
        </div>

        {/* Change indicator badge */}
        <div
          className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive
              ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/15'
              : isNegative
              ? 'text-rose-700 bg-rose-100 dark:text-rose-400 dark:bg-rose-500/15'
              : 'text-slate-700 bg-slate-100 dark:text-gray-400 dark:bg-gray-500/15'
          }`}
        >
          <span>{change}</span>
          {isPositive && <ArrowUpRight className="w-3.5 h-3.5" />}
          {isNegative && <ArrowUpRight className="w-3.5 h-3.5" />}
        </div>
      </div>

      <div>
        <div className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">
          {value}
        </div>
        <div className="text-xs font-medium text-[var(--text-secondary)]">
          {title}
        </div>
      </div>
    </motion.div>
  );
};
