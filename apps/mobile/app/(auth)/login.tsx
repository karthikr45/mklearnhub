import { Link } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'

import { api } from '@/lib/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = async () => {
    await api.post('/auth/login', { email, password })
  }

  return (
    <View className="flex-1 justify-center gap-4 p-6">
      <Text className="text-2xl font-bold">Sign in</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" className="rounded border p-3" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry className="rounded border p-3" />
      <Pressable onPress={submit} className="rounded bg-black p-3">
        <Text className="text-center text-white">Sign in</Text>
      </Pressable>
      <Link href="/(auth)/register">Create account</Link>
    </View>
  )
}
