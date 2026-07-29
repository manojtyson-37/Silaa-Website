import React, { useCallback } from 'react'
import { ArrayOfObjectsInputProps, set, useFormValue } from 'sanity'
import { Button, Stack, Card, Text } from '@sanity/ui'

export function VariantMatrixInput(props: ArrayOfObjectsInputProps) {
  const { onChange, value = [] } = props
  
  const availableSizes = (useFormValue(['availableSizes']) as any[]) || []
  const availableColors = (useFormValue(['availableColors']) as any[]) || []

  const handleGenerate = useCallback(() => {
    if (availableSizes.length === 0 && availableColors.length === 0) {
      alert('Please select at least one Size or Color first in the Category Metafields.')
      return
    }

    const newVariants = [...value]
    
    // Fallback if one is empty
    const sizesToLoop = availableSizes.length > 0 ? availableSizes : [{ _ref: null }]
    const colorsToLoop = availableColors.length > 0 ? availableColors : [{ _ref: null }]

    sizesToLoop.forEach((sizeRef: any) => {
      colorsToLoop.forEach((colorRef: any) => {
        // Check if this combination already exists
        const exists = newVariants.some(
          (v: any) => 
            (v.size?._ref === sizeRef._ref) && 
            (v.color?._ref === colorRef._ref)
        )
        
        if (!exists) {
          const firstPrice = (value as any[]).length > 0 ? (value as any[])[0].price : "0"
          const newVariant: any = {
            _type: 'object',
            _key: Math.random().toString(36).substring(7),
            id: Math.floor(Math.random() * 1000000000),
            price: firstPrice, // Default to first variant's price
            available: true,
          }
          if (sizeRef._ref) {
            newVariant.size = { _type: 'reference', _ref: sizeRef._ref }
          }
          if (colorRef._ref) {
            newVariant.color = { _type: 'reference', _ref: colorRef._ref }
          }
          newVariants.push(newVariant)
        }
      })
    })

    onChange(set(newVariants))
  }, [availableSizes, availableColors, value, onChange])

  return (
    <Stack space={3}>
      <Card padding={3} tone="primary" radius={2} border>
        <Stack space={3}>
          <Text size={1} weight="semibold">Matrix Generator</Text>
          <Text size={1} muted>Click to automatically generate variant rows for all combinations of selected Sizes and Colors. You can then fill in the prices below.</Text>
          <Button text="Generate Variants Matrix" tone="positive" onClick={handleGenerate} />
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  )
}
