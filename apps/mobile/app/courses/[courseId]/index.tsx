import { useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'

export default function CourseDetail() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>()
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-xl font-semibold">Course {courseId}</Text>
    </View>
  )
}
