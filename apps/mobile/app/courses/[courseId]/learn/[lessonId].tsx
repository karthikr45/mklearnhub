import { useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'

export default function LessonPlayer() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>()
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-xl font-semibold">Lesson {lessonId}</Text>
    </View>
  )
}
