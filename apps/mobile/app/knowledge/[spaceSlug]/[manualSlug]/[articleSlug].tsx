import { useLocalSearchParams } from 'expo-router'
import { ScrollView, Text } from 'react-native'

export default function Article() {
  const { articleSlug } = useLocalSearchParams<{ articleSlug: string }>()
  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-xl font-bold">Article: {articleSlug}</Text>
    </ScrollView>
  )
}
