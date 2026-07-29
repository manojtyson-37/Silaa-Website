import React, { useCallback, useEffect, useState } from 'react'
import { ArrayOfObjectsInputProps, set, useFormValue, useClient } from 'sanity'
import { Button, Stack, Card, Text, Grid, Box, TextInput, Flex } from '@sanity/ui'
import { TrashIcon } from '@sanity/icons/Trash'

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

    const sizesToLoop = availableSizes.length > 0 ? availableSizes : [{ _ref: null }]
    const colorsToLoop = availableColors.length > 0 ? availableColors : [{ _ref: null }]

    const validVariants: any[] = []
    const newVariants = [...value]

    sizesToLoop.forEach((sizeRef: any) => {
      colorsToLoop.forEach((colorRef: any) => {
        const existing = newVariants.find(
          (v: any) => 
            (v.size?._ref === sizeRef._ref) && 
            (v.color?._ref === colorRef._ref)
        )
        
        if (existing) {
          validVariants.push(existing)
        } else {
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
          validVariants.push(newVariant)
        }
      })
    })

    onChange(set(validVariants))
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

  const handleDeleteVariant = useCallback((index: number) => {
    const newVariants = [...value]
    newVariants.splice(index, 1)
    onChange(set(newVariants))
  }, [value, onChange])

  const handleClearAll = useCallback(() => {
    if (confirm('Are you sure you want to delete all variants?')) {
      onChange(set([]))
    }
  }, [onChange])

  return (
    <Stack space={5}>
      <Card padding={4} tone="default" radius={3} shadow={1} border>
        <Flex justify="space-between" align="center">
          <Box>
            <Text size={2} weight="semibold" style={{marginBottom: 8}}>Variant Matrix Generator</Text>
            <Text size={1} muted>Automatically map your selected Sizes and Colors to product variants.</Text>
          </Box>
          <Flex gap={3}>
            {value.length > 0 && <Button text="Clear All" tone="critical" mode="ghost" onClick={handleClearAll} />}
            <Button text="Sync Matrix" tone="positive" onClick={handleGenerate} />
          </Flex>
        </Flex>
      </Card>

      {value.length > 0 && (
        <Card shadow={1} radius={3} border style={{ overflow: 'hidden' }}>
          {/* Table Header */}
          <Card padding={3} borderBottom tone="transparent">
            <Grid columns={4} gap={4} style={{ gridTemplateColumns: '1fr 1fr 1fr auto', padding: '0 16px' }}>
              <Text size={1} weight="semibold" muted>VARIANT</Text>
              <Text size={1} weight="semibold" muted>PRICE (₹)</Text>
              <Text size={1} weight="semibold" muted>INVENTORY</Text>
              <Box></Box>
            </Grid>
          </Card>
          {/* Table Body */}
          <Stack>
            {(value as any[]).map((variant, index) => {
              const sName = sizeNames[variant.size?._ref] || ''
              const cName = colorNames[variant.color?._ref] || ''
              let title = [sName, cName].filter(Boolean).join(' / ')
              if (!title) title = 'Unknown Variant'
              
              return (
                <Card padding={3} borderBottom={index !== value.length - 1} key={variant._key} tone="default">
                  <Grid columns={4} gap={4} style={{ alignItems: 'center', gridTemplateColumns: '1fr 1fr 1fr auto', padding: '0 16px' }}>
                    <Box>
                      <Text size={2} weight="semibold">{title}</Text>
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
                        value={variant.inventory?.toString() || ''}
                        placeholder="0"
                        type="number"
                        onChange={(e) => handleUpdateVariant(index, 'inventory', parseInt(e.currentTarget.value, 10))}
                      />
                    </Box>
                    <Box>
                      <Button 
                        icon={TrashIcon} 
                        mode="ghost" 
                        tone="critical" 
                        padding={2}
                        onClick={() => handleDeleteVariant(index)}
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
