import React, { useCallback, useState, useRef } from 'react'
import { ArrayOfObjectsInputProps, setIfMissing, insert, useClient } from 'sanity'
import { Button, Stack, Card, Text } from '@sanity/ui'

export function MultiImageUpload(props: ArrayOfObjectsInputProps) {
  const client = useClient({ apiVersion: '2023-05-03' })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length === 0) return

      setUploading(true)
      try {
        // Upload all assets in parallel
        const uploadedAssets = await Promise.all(
          files.map((file) => client.assets.upload('image', file))
        )

        // Create the image objects with references
        const newItems = uploadedAssets.map((asset) => ({
          _type: 'image',
          _key: Math.random().toString(36).substring(2, 9),
          asset: {
            _type: 'reference',
            _ref: asset._id,
          },
        }))

        // If the array doesn't exist yet, initialize it
        props.onChange(setIfMissing([]))
        // Append the new images to the end of the array
        props.onChange(insert(newItems, 'after', [-1]))
      } catch (err) {
        console.error('Upload failed:', err)
        alert('Failed to upload images. Please try again.')
      } finally {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [client, props]
  )

  return (
    <Stack space={3}>
      {/* The default array UI (which handles dragging, sorting, deleting, and grid display) */}
      {props.renderDefault(props)}

      {/* Our custom bulk upload button */}
      <Card padding={3} radius={2} tone="primary" border>
        <Stack space={3}>
          <Text size={1} weight="medium">
            Bulk Upload Images
          </Text>
          <Text size={1} muted>
            Click the button below to select multiple files at once from your computer.
          </Text>
          <Button
            mode="ghost"
            tone="primary"
            text={uploading ? 'Uploading...' : 'Select Multiple Images'}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          />
        </Stack>
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </Card>
    </Stack>
  )
}
