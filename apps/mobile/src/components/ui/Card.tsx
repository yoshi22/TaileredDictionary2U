import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { colors } from '@/theme/colors'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  variant?: 'default' | 'elevated'
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>{children}</View>
  )
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background.light,
    borderRadius: 12,
    padding: 16,
  },
  default: {
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  elevated: {
    shadowColor: colors.gray[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
})
