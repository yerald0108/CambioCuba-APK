/**
 * Pantalla de Login — CambioCuba
 */

import { useRef } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ShieldCheck } from 'lucide-react-native';

import { loginSchema, type LoginFormData } from '@utils/validators';
import { loginUser } from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';
import { notify } from '@stores/notifications.store';
import { KeyboardAvoidingScreen } from '@components/ui/KeyboardAvoidingScreen';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Colors } from '@constants/theme';

export default function LoginScreen() {
  const setUser    = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  async function onSubmit(formData: LoginFormData) {
    setLoading(true);
    const { data, error } = await loginUser(formData);
    setLoading(false);

    if (error) {
      notify.error('Error al iniciar sesión', error);
      return;
    }

    if (data) {
      setUser(data);
      router.replace(data.role === 'admin' ? '/(admin)/dashboard' : '/(app)/(tabs)');
    }
  }

  return (
    <KeyboardAvoidingScreen>
      {/* ── Encabezado ── */}
      <View style={{ alignItems: 'center', paddingTop: 72, paddingBottom: 44 }}>
        <View style={{
          width: 72, height: 72, borderRadius: 20,
          backgroundColor: Colors.accentMuted,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, borderWidth: 1, borderColor: Colors.accent,
          shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
        }}>
          <ShieldCheck color={Colors.accent} size={36} strokeWidth={1.8} />
        </View>
        <Text style={{ color: Colors.accent, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 }}>
          CambioCuba
        </Text>
        <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>
          Intercambio P2P seguro y confiable
        </Text>
      </View>

      {/* ── Formulario ── */}
      <View style={{ gap: 14 }}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Correo electrónico"
              placeholder="correo@ejemplo.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              leftIcon={<Mail color={Colors.textMuted} size={17} strokeWidth={1.8} />}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              ref={passwordRef}
              label="Contraseña"
              placeholder="Tu contraseña"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              leftIcon={<Lock color={Colors.textMuted} size={17} strokeWidth={1.8} />}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />
      </View>

      {/* ── Botón ── */}
      <View style={{ marginTop: 28 }}>
        <Button label="Iniciar sesión" onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg" />
      </View>

      {/* ── Separador ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 28 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
        <Text style={{ color: Colors.textMuted, fontSize: 13 }}>o</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
      </View>

      {/* ── Link a registro ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
        <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>¿No tienes cuenta?</Text>
        <Pressable onPress={() => router.replace('/(auth)/register')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: Colors.accent, fontSize: 14, fontWeight: '600' }}>Regístrate gratis</Text>
        </Pressable>
      </View>

      {/* ── Aviso de seguridad ── */}
      <View style={{
        marginTop: 40, padding: 14, backgroundColor: Colors.surface,
        borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      }}>
        <ShieldCheck color={Colors.success} size={16} strokeWidth={2} style={{ marginTop: 1 }} />
        <Text style={{ color: Colors.textSecondary, fontSize: 12, lineHeight: 17, flex: 1 }}>
          CambioCuba nunca toca tu dinero. Solo conectamos compradores y vendedores.
          Los pagos se realizan directamente entre usuarios.
        </Text>
      </View>
    </KeyboardAvoidingScreen>
  );
}
