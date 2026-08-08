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
      className="bg-[#141726] border border-[#23263A] hover:border-[#333754] rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        {/* Rounded dark blue icon box */}
        <div className="w-10 h-10 rounded-xl bg-[#1E2338] border border-[#2B314F] flex items-center justify-center shadow-inner">
          {getIcon()}
        </div>

        {/* Change indicator badge */}
        <div
          className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive
              ? 'text-emerald-400 bg-emerald-500/10'
              : isNegative
              ? 'text-rose-400 bg-rose-500/10'
              : 'text-gray-400 bg-gray-500/10'
          }`}
        >
          <span>{change}</span>
          {isPositive && <ArrowUpRight className="w-3.5 h-3.5" />}
          {isNegative && <ArrowUpRight className="w-3.5 h-3.5" />}
        </div>
      </div>

      <div>
        <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1">
          {value}
        </div>
        <div className="text-xs font-medium text-[#8E95AF]">
          {title}
        </div>
      </div>
    </motion.div>
  );
};
