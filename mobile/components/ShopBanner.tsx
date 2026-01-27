/**
 * Composant Banner pour la boutique mobile
 * Correspond au design du web
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Banner } from '../src/services/bannerAPI';

const { width } = Dimensions.get('window');

interface ShopBannerProps {
  banner: Banner;
  onPress?: () => void;
}

export default function ShopBanner({ banner, onPress }: ShopBannerProps) {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (banner.showCountdown && banner.endDate) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(banner.endDate!).getTime();
        const distance = end - now;

        if (distance > 0) {
          setCountdown({
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000),
          });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [banner.showCountdown, banner.endDate]);

  const getBackgroundComponent = () => {
    if (banner.backgroundType === 'gradient' && banner.backgroundValue) {
      const colors = banner.backgroundValue.split(',');
      return (
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      );
    } else if (banner.backgroundType === 'color' && banner.backgroundValue) {
      return <View style={[StyleSheet.absoluteFill, { backgroundColor: banner.backgroundValue }]} />;
    }
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#a855f7' }]} />;
  };

  const getBannerHeight = () => {
    switch (banner.height) {
      case 'small': return 200;
      case 'medium': return 300;
      case 'large': return 400;
      default: return 300;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.container, { height: getBannerHeight() }]}
    >
      {getBackgroundComponent()}

      {banner.mainImage && (
        <Image
          source={{ uri: banner.mainImage }}
          style={styles.mainImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        {banner.showBadge && banner.badgeText && (
          <View style={[styles.badge, { backgroundColor: banner.badgeColor || '#ef4444' }]}>
            <Text style={styles.badgeText}>{banner.badgeText}</Text>
          </View>
        )}

        {banner.title && (
          <Text style={[styles.title, { color: banner.textColor || '#fff' }]} numberOfLines={2}>
            {banner.title}
          </Text>
        )}

        {banner.subtitle && (
          <Text style={[styles.subtitle, { color: banner.textColor || '#fff' }]} numberOfLines={1}>
            {banner.subtitle}
          </Text>
        )}

        {banner.description && (
          <Text style={[styles.description, { color: banner.textColor || '#fff' }]} numberOfLines={3}>
            {banner.description}
          </Text>
        )}

        {banner.showCountdown && (
          <View style={styles.countdown}>
            <View style={styles.countdownBox}>
              <Text style={styles.countdownNumber}>{String(countdown.hours).padStart(2, '0')}</Text>
              <Text style={styles.countdownLabel}>H</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            <View style={styles.countdownBox}>
              <Text style={styles.countdownNumber}>{String(countdown.minutes).padStart(2, '0')}</Text>
              <Text style={styles.countdownLabel}>M</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            <View style={styles.countdownBox}>
              <Text style={styles.countdownNumber}>{String(countdown.seconds).padStart(2, '0')}</Text>
              <Text style={styles.countdownLabel}>S</Text>
            </View>
          </View>
        )}

        {banner.ctaText && (
          <View style={[styles.ctaButton, { backgroundColor: banner.buttonColor || '#fff' }]}>
            <Text style={[styles.ctaText, { color: banner.textColor === '#fff' ? '#000' : '#fff' }]}>
              {banner.ctaText}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mainImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.9,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.8,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  countdownNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  countdownLabel: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
  },
  countdownSeparator: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
