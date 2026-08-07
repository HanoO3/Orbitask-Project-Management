'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logoPic from '@/public/orbitask-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  href?: string;
}

export function OrbitaskLogo({
  size = 'md',
  showText = true,
  className = '',
  href = '/dashboard',
}: LogoProps) {
  const imageSizes = {
    sm: { dimension: 'w-8 h-8', textClass: 'text-lg' },
    md: { dimension: 'w-10 h-10', textClass: 'text-xl' },
    lg: { dimension: 'w-12 h-12', textClass: 'text-2xl' },
  };

  const { dimension, textClass } = imageSizes[size];

  return (
    <Link href={href} className={`inline-flex items-center gap-3 group ${className}`}>
      <div className={`relative flex items-center justify-center shrink-0 ${dimension}`}>
        <Image
          src={logoPic}
          alt="Orbitask Logo"
          priority
          className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      {showText && (
        <span
          className={`font-extrabold tracking-tight text-white ${textClass} group-hover:text-[#5B82FF] transition-colors`}
        >
          Orbitask
        </span>
      )}
    </Link>
  );
}
