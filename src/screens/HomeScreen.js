import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { quotes } from '../data/quotes';
import { colors, spacing } from '../theme';

const ROTATE_INTERVAL = 10000;

export default function HomeScreen({ navigation }) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const dayOfYear = Math.floor((Date.now() - start) / 86400000);
    setQuoteIndex(dayOfYear % quotes.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setQuoteIndex(i => (i + 1) % quotes.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, ROTATE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const quote = quotes[quoteIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Text style={styles.appName}>METAM</Text>
      </View>

      <View style={styles.quoteSection}>
        <Image
          source={require('../../assets/Greek_God.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />
        <Animated.View style={[styles.quoteCard, { opacity: fadeAnim }]}>
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          {quote.author && <Text style={styles.quoteAuthor}>— {quote.author}</Text>}
        </Animated.View>
        <View style={styles.quoteDots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i === quoteIndex % 3 && styles.dotActive]} />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Programs')}
        >
          <Text style={styles.primaryBtnText}>START WORKOUT</Text>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Programs')}
          >
            <Text style={styles.secondaryBtnText}>PROGRAMS</Text>
          </TouchableOpacity>

          <View style={styles.btnDivider} />

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.secondaryBtnText}>PROFILE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  appName: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
  },
  quoteSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroImage: {
    width: 300,
    height: 300,
  },
  quoteCard: {
    alignSelf: 'stretch',
    borderLeftWidth: 2,
    borderLeftColor: colors.borderLight,
    paddingLeft: spacing.md,
    gap: spacing.sm,
  },
  quoteText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 32,
    letterSpacing: 0.2,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500',
    letterSpacing: 1,
  },
  quoteDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.tertiary,
  },
  dotActive: {
    backgroundColor: colors.secondary,
    width: 16,
  },
  actions: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    borderRadius: 2,
  },
  primaryBtnText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
  },
  secondaryRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  btnDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
});
