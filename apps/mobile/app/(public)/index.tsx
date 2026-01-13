import { View, Text, StyleSheet, Image } from 'react-native'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@/components/ui'
import { colors } from '@/theme/colors'

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo / Hero */}
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>TD2U</Text>
          </View>
          <Text style={styles.title}>TaileredDictionary2U</Text>
          <Text style={styles.subtitle}>
            AI-powered vocabulary learning with spaced repetition
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem
            icon="+"
            title="Add Terms"
            description="Register any term you want to learn"
          />
          <FeatureItem
            icon="AI"
            title="AI Enrichment"
            description="Get translations, examples, and explanations"
          />
          <FeatureItem
            icon="R"
            title="Smart Review"
            description="Spaced repetition optimizes your learning"
          />
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttons}>
          <Link href="/signup" asChild>
            <Button title="Get Started" size="lg" />
          </Link>
          <Link href="/login" asChild>
            <Button title="Sign In" variant="outline" size="lg" />
          </Link>
        </View>
      </View>
    </SafeAreaView>
  )
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>{icon}</Text>
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  features: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  buttons: {
    gap: 12,
    marginBottom: 20,
  },
})
