/**
 * Pantalla de Registro — CambioCuba
 */

import { useRef } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, ShieldCheck } from 'lucide-react-native';

import { registerSchema, type RegisterFormData } from '@utils/validators';
import { registerUser } from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';
import { notify } from '@stores/notifications.store';
import { KeyboardAvoidingScreen } from '@components/ui/KeyboardAvoidingScreen';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Colors } from '@constants/theme';

export default function RegisterScreen() {
  const setUser    = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  const emailRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef  = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '', confirm_password: '' },
    mode: 'onTouched',
  });

  async function onSubmit(formData: RegisterFormData) {
    setLoading(true);
    const { data, error } = await registerUser(formData);
    setLoading(false);

    if (error) {
      notify.error('Error al registrarse', error);
      return;
    }

    if (data) {
      setUser(data);
      notify.success('¡Bienvenido a CambioCuba!', 'Tu cuenta fue creada exitosamente.');
    }
  }

  return (
    <KeyboardAvoidingScreen>
      {/* ── Encabezado ── */}
      <View style={{ alignItems: 'center', paddingTop: 52, paddingBottom: 36 }}>
        <View style={{
          width: 64, height: 64, borderRadius: 18,
          backgroundColor: Colors.accentMuted,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, borderWidth: 1, borderColor: Colors.accent,
        }}>
          <ShieldCheck color={Colors.accent} size={32} strokeWidth={1.8} />
        </View>
        <Text style={{ color: Colors.textPrimary, fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 }}>
          Crear cuenta
        </Text>
        <Text style={{ color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
          Únete a la comunidad P2P{'\n'}más confiable de Cuba
        </Text>
      </View>

      {/* ── Formulario ── */}
      <View style={{ gap: 14 }}>
        <Controller
          control={control}
          name="full_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nombre completo"
              placeholder="Carlos Rodríguez Pérez"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.full_name?.message}
              leftIcon={<User color={Colors.textMuted} size={17} strokeWidth={1.8} />}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              ref={emailRef}
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
              placeholder="Mínimo 8 caracteres"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              leftIcon={<Lock color={Colors.textMuted} size={17} strokeWidth={1.8} />}
              isPassword
              hint="Debe tener al menos 8 caracteres, una mayúscula y un número"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="confirm_password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              ref={confirmRef}
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirm_password?.message}
              leftIcon={<Lock color={Colors.textMuted} size={17} strokeWidth={1.8} />}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />
      </View>

      {/* ── Aviso legal ── */}
      <Text style={{
        color: Colors.textMuted, fontSize: 12, textAlign: 'center',
        lineHeight: 17, marginTop: 20, marginBottom: 20,
      }}>
        Al crear tu cuenta aceptas que CambioCuba{'\n'}
        es solo una plataforma de contacto P2P.{'\n'}
        No somos responsables de las transacciones.
      </Text>

      {/* ── Botón ── */}
      <Button label="Crear cuenta" onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg" />

      {/* ── Separador ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
        <Text style={{ color: Colors.textMuted, fontSize: 13 }}>o</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
      </View>

      {/* ── Link a login ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
        <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>¿Ya tienes cuenta?</Text>
        <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: Colors.accent, fontSize: 14, fontWeight: '600' }}>Iniciar sesión</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingScreen>
  );
}
