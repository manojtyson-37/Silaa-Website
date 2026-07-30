import React, { useEffect, useState, useCallback } from 'react'
import { ArrayOfObjectsInputProps, set, useClient } from 'sanity'
import { Card, Checkbox, Flex, Stack, Text, Box, Grid } from '@sanity/ui'

export function MultiSelectReferenceInput(props: ArrayOfObjectsInputProps) {
  const { value = [], onChange, schemaType } = props
  const client = useClient({ apiVersion: '2023-05-03' })
  const [options, setOptions] = useState<any[]>([])
  
  // Extract the reference type this array points to (e.g., 'size' or 'color')
  const refType = (schemaType as any)?.of?.[0]?.to?.[0]?.name

  useEffect(() => {
    if (!refType) return
    // Published documents only. The Studio client sees drafts too, which meant a
    // size/colour with unsaved edits showed up twice, and picking a draft-only one
    // left the public site unable to resolve its name (the variant label silently
    // lost its size or colour).
    client
      .fetch(`*[_type == "${refType}" && !(_id in path("drafts.**"))]{_id, name} | order(name asc)`)
      .then(setOptions)
  }, [client, refType])

  const handleToggle = useCallback(
    (optionId: string, checked: boolean) => {
      const currentValues = (value as any[]) || []
      
      if (checked) {
        // Add to array
        const newValues = [
          ...currentValues,
          {
            _key: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`,
            _type: 'reference',
            _ref: optionId,
          }
        ]
        onChange(set(newValues))
      } else {
        // Remove from array
        const newValues = currentValues.filter((v: any) => v._ref !== optionId)
        // If empty, Sanity prefers `unset()`, but setting empty array is usually fine
        onChange(set(newValues))
      }
    },
    [onChange, value]
  )

  return (
    <Card padding={4} tone="default" shadow={1} radius={3} border>
      <Grid columns={[2, 3]} gap={3}>
        {options.map((option) => {
          const isSelected = (value as any[]).some((v: any) => v._ref === option._id)
          return (
            <Flex align="center" key={option._id}>
              <Checkbox
                checked={isSelected}
                onChange={(e) => handleToggle(option._id, e.currentTarget.checked)}
                style={{ cursor: 'pointer' }}
              />
              <Box marginLeft={3}>
                <Text style={{ cursor: 'pointer' }} onClick={() => handleToggle(option._id, !isSelected)}>
                  {option.name}
                </Text>
              </Box>
            </Flex>
          )
        })}
        {options.length === 0 && (
          <Text muted>No published options found. Create them and hit Publish first.</Text>
        )}
      </Grid>
    </Card>
  )
}
