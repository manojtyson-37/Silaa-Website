import React, { useCallback, useEffect, useState } from 'react'
import { ArrayOfObjectsInputProps, set, useFormValue, useClient } from 'sanity'
import { Button, Stack, Card, Text, Grid, Box, TextInput, Flex } from '@sanity/ui'

export function VariantMatrixInput(props: ArrayOfObjectsInputProps) {
  const { onChange, value = [] } = props
  const client = useClient({ apiVersion: '2023-05-03' })
  
  const availableSizes = (useFormValue(['availableSizes']) as any[]) || []
  const availableColors = (useFormValue(['availableColors']) as any[]) || []

  // Store names of sizes and colors to render the titles nicely in the table
  const [sizeNames, setSizeNames] = useState<Record<string, string>>({})
  const [colorNames, setColorNames] = useState<Record<string, string>>({})

  useEffect(() => {
    client.fetch(`*[_type == "size"]{_id, name}`).then((res: any[]) => {
      const map: Record<string, string> = {}
      res.forEach(item => { map[item._id] = item.name })
      setSizeNames(map)
    })
    client.fetch(`*[_type == "color"]{_id, name}`).then((res: any[]) => {
      const map: Record<string, string> = {}
      res.forEach(item => { map[item._id] = item.name })
      setColorNames(map)
    })
  }, [client])

  const handleGenerate = useCallback(() => {
    if (availableSizes.length === 0 && availableColors.length === 0) {
      alert('Please select at least one Size or Color first in the Category Metafields.')
      return
    }

    const newVariants = [...value]
    
    const sizesToLoop = availableSizes.length > 0 ? availableSizes : [{ _ref: null }]
    const colorsToLoop = availableColors.length > 0 ? availableColors : [{ _ref: null }]

    sizesToLoop.forEach((sizeRef: any) => {
      colorsToLoop.forEach((colorRef: any) => {
        const exists = newVariants.some(
          (v: any) => 
            (v.size?._ref === sizeRef._ref) && 
            (v.color?._ref === colorRef._ref)
        )
        
        if (!exists) {
          const firstPrice = (value as any[]).length > 0 ? (value as any[])[0].price : ""
          const newVariant: any = {
            _type: 'object',
            _key: Math.random().toString(36).substring(7),
            id: Math.floor(Math.random() * 1000000000),
            price: firstPrice, 
            available: true,
          }
          if (sizeRef._ref) newVariant.size = { _type: 'reference', _ref: sizeRef._ref }
          if (colorRef._ref) newVariant.color = { _type: 'reference', _ref: colorRef._ref }
          newVariants.push(newVariant)
        }
      })
    })

    onChange(set(newVariants))
  }, [availableSizes, availableColors, value, onChange])

  const handleUpdateVariant = useCallback((index: number, field: string, newValue: any) => {
    const newVariants = [...value]
    // Filter out NaN for number inputs
    if (field === 'inventory' || field === 'erpVariantId') {
        if (Number.isNaN(newValue)) newValue = undefined
    }
    newVariants[index] = { ...newVariants[index], [field]: newValue }
    onChange(set(newVariants))
  }, [value, onChange])

  return (
    <Stack space={4}>
      <Card padding={3} tone="primary" radius={2} border>
        <Flex justify="space-between" align="center">
          <Box>
            <Text size={1} weight="semibold" style={{marginBottom: 4}}>Matrix Generator</Text>
            <Text size={1} muted>Automatically generate missing variants from selected Sizes and Colors.</Text>
          </Box>
          <Button text="Generate Variants Matrix" tone="positive" onClick={handleGenerate} />
        </Flex>
      </Card>

      {value.length > 0 && (
        <Card border radius={2}>
          {/* Table Header */}
          <Card padding={3} borderBottom tone="transparent">
            <Grid columns={5} gap={3}>
              <Text size={1} weight="semibold">Variant</Text>
              <Text size={1} weight="semibold">Price (₹)</Text>
              <Text size={1} weight="semibold">Compare (₹)</Text>
              <Text size={1} weight="semibold">Inventory</Text>
              <Text size={1} weight="semibold">ERP ID</Text>
            </Grid>
          </Card>
          {/* Table Body */}
          <Stack>
            {(value as any[]).map((variant, index) => {
              const sName = sizeNames[variant.size?._ref] || ''
              const cName = colorNames[variant.color?._ref] || ''
              const title = [sName, cName].filter(Boolean).join(' / ') || 'Unknown Variant'
              
              return (
                <Card padding={3} borderBottom={index !== value.length - 1} key={variant._key}>
                  <Grid columns={5} gap={3} style={{ alignItems: 'center' }}>
                    <Box>
                      <Text size={2} weight="medium">{title}</Text>
                    </Box>
                    <Box>
                      <TextInput 
                        value={variant.price || ''}
                        placeholder="0.00"
                        onChange={(e) => handleUpdateVariant(index, 'price', e.currentTarget.value)}
                      />
                    </Box>
                    <Box>
                      <TextInput 
                        value={variant.compare_at_price || ''}
                        placeholder="Optional"
                        onChange={(e) => handleUpdateVariant(index, 'compare_at_price', e.currentTarget.value)}
                      />
                    </Box>
                    <Box>
                      <TextInput 
                        value={variant.inventory?.toString() || ''}
                        placeholder="0"
                        type="number"
                        onChange={(e) => handleUpdateVariant(index, 'inventory', parseInt(e.currentTarget.value, 10))}
                      />
                    </Box>
                    <Box>
                      <TextInput 
                        value={variant.erpVariantId?.toString() || ''}
                        placeholder="Optional"
                        type="number"
                        onChange={(e) => handleUpdateVariant(index, 'erpVariantId', parseInt(e.currentTarget.value, 10))}
                      />
                    </Box>
                  </Grid>
                </Card>
              )
            })}
          </Stack>
        </Card>
      )}
      
      {value.length === 0 && (
        <Card padding={4} border radius={2} tone="transparent">
          <Text align="center" muted>No variants exist. Click "Generate" to populate the matrix.</Text>
        </Card>
      )}
    </Stack>
  )
}
