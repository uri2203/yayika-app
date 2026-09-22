import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { typography, spacing, borderRadius } from '../config/theme';
import { CelebrationType, getCelebration } from '../services/celebrationService';

interface CelebrationOverlayProps {
  visible: boolean;
  type: CelebrationType;
  message?: string;
  xp?: number;
  onDismiss: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiDot {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
  speed: number;
}

function generateConfetti(count: number): ConfettiDot[] {
  const colors = ['#F472B6', '#D4A843', '#10B981', '#8B5CF6', '#3B82F6', '#06B6D4', '#EC4899'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 800,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 4 + Math.random() * 6,
    speed: 2000 + Math.random() * 2000,
  }));
}

export default function CelebrationOverlay({
  visible,
  type,
  message,
  xp,
  onDismiss,
}: CelebrationOverlayProps) {
  const { currentColors } = useTheme();
  const colors = currentColors;

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  const celebration = getCelebration(type);
  const confetti = generateConfetti(30);

  const [confettiAnims] = useState(() =>
    confetti.map(() => ({
      translateY: new Animated.Value(-20),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  );

  useEffect(() => {
    if (visible) {
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.3);
      fadeOutAnim.setValue(1);

      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Bounce the icon
      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      bounce.start();

      // Animate confetti
      confettiAnims.forEach((anim, i) => {
        const conf = confetti[i];
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 200,
            delay: conf.delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: SCREEN_HEIGHT * 0.6,
            duration: conf.speed,
            delay: conf.delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 360 + Math.random() * 720,
            duration: conf.speed,
            delay: conf.delay,
            useNativeDriver: true,
          }),
        ]).start();
      });

      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3000);

      return () => {
        bounce.stop();
        clearTimeout(timer);
      };
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const iconScale = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  const celebrationMessage = message || celebration.message;
  const displayXp = xp || celebration.xp;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <Animated.View style={[styles.overlay, { opacity: fadeOutAnim }]}>
        <TouchableOpacity style={styles.dismissArea} onPress={handleDismiss} activeOpacity={1}>
          {/* Confetti */}
          {confetti.map((dot, i) => (
            <Animated.View
              key={dot.id}
              style={[
                styles.confettiDot,
                {
                  backgroundColor: dot.color,
                  width: dot.size,
                  height: dot.size,
                  borderRadius: dot.size / 2,
                  left: dot.x,
                  opacity: confettiAnims[i].opacity,
                  transform: [
                    { translateY: confettiAnims[i].translateY },
                    { rotate: confettiAnims[i].rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }) },
                  ],
                },
              ]}
            />
          ))}

          {/* Center content */}
          <Animated.View
            style={[
              styles.content,
              {
                backgroundColor: colors.white,
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                { backgroundColor: celebration.color + '20', transform: [{ scale: iconScale }] },
              ]}
            >
              <Ionicons name={celebration.icon as any} size={48} color={celebration.color} />
            </Animated.View>

            <Text style={[styles.message, { color: colors.text }]}>
              {celebrationMessage}
            </Text>

            <View style={styles.xpRow}>
              <Ionicons name="star" size={18} color={colors.gold} />
              <Text style={[styles.xpText, { color: colors.gold }]}>+{displayXp} XP</Text>
            </View>

            <Text style={[styles.tapHint, { color: colors.subtleText }]}>
              Toca para cerrar
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiDot: {
    position: 'absolute',
    top: -10,
  },
  content: {
    width: SCREEN_WIDTH * 0.8,
    maxWidth: 340,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  xpText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  tapHint: {
    fontSize: typography.sizes.xs,
    opacity: 0.6,
  },
});
