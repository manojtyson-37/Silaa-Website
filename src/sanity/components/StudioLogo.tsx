import React from 'react'
import { Text, Flex } from '@sanity/ui'

export function StudioLogo(props: any) {
  const { renderDefault, title } = props
  return (
    <Flex align="center" gap={2}>
      {/* A stylized dot for a clean modern aesthetic */}
      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
      <Text weight="bold" size={2} style={{ letterSpacing: '0.5px' }}>
        {title || 'Silaa Collective'}
      </Text>
    </Flex>
  )
}
