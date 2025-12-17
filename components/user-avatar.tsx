'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  name: string;
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-2xl',
};

export function UserAvatar({ name, userId, size = 'md', className = '' }: UserAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchAvatar();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchAvatar = async () => {
    try {
      const url = userId ? `/api/profile/avatar?userId=${userId}` : '/api/profile/avatar';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.url);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  const initials = name
    ?.split(' ')
    ?.map((n) => n?.[0])
    ?.slice(0, 2)
    ?.join('')
    ?.toUpperCase() || 'U';

  if (loading) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} rounded-full bg-gray-200 animate-pulse`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold relative`}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          fill
          className="object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
