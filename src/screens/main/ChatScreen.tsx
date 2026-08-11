import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const AI_CONFIG = {
  systemPrompts: {
    cycle: 'Eres Laura, la asistente de Yayika. Ayudas a mujeres a entender su ciclo menstrual y cómo afecta su productividad.',
    finance: 'Eres Laura, la asistente financiera de Yayika. Ayudas a mujeres a gestionar su dinero con psicología emocional femenina.',
    productivity: 'Eres Laura, la asistente de productividad de Yayika. Ayudas a mujeres a ser más productivas aprovechando sus fases hormonales.',
    general: 'Eres Laura, la asistente de Yayika. Respondes preguntas sobre el portal, los cursos, el tracking de ciclo, finanzas y productividad.',
  },
  routing: {
    cycle: ['ciclo', 'menstru', 'fase', 'ovulat', 'lutea', 'folicular', 'periodo', 'menstruación', 'síntomas', 'energía'],
    finance: ['dinero', 'presupuesto', 'ahorro', 'gasto', 'ingreso', 'finanza', 'meta', 'invertir', 'deuda'],
    productivity: ['productiv', 'tarea', 'trabajo', 'planificar', 'organizar', 'tiempo', 'procrastin', 'enfoque'],
  },
  responses: {
    cycle: {
      es: [
        'Basándome en tu ciclo, cada fase tiene energía diferente. 🌙\n\n• **Menstrual**: Descansa y reflexiona\n• **Folicular**: IDEAL para empezar proyectos nuevos\n• **Ovulatoria**: Mejor momento para negociar y reuniones\n• **Lútea**: Enfócate en detalles y tareas administrativas\n\n¿En qué fase estás hoy?',
        'Tu ciclo es tu superpoder. 💪\n\n¿Sabías que en la fase folicular tu cerebro está más receptivo a aprender cosas nuevas? Aprovecha esa energía para tomar cursos o aprender habilidades.\n\n¿Te gustaría saber qué tareas son ideales para cada fase?',
      ],
    },
    finance: {
      es: [
        'Aquí van tips financieros para mujeres: 💰\n\n1. **Regla 50/30/20**: 50% necesidades, 30% deseos, 20% ahorro\n2. **Fondo de emergencia**: 3-6 meses de gastos\n3. **Invierte en ti**: Los cursos son la mejor inversión\n\n¿Quieres que profundicemos en alguno?',
        'La psicología financiera femenina es diferente. 🧠\n\nLas mujeres tendemos a subestimar nuestros ingresos y sobreestimar gastos. El primer paso es ser honesta con tu situación actual.\n\n¿Quieres ayuda para crear un presupuesto?',
      ],
    },
    productivity: {
      es: [
        'Productividad femenina = productividad cíclica. 📋\n\nNo fuerces la productividad igual todos los días. Adapta tus tareas a tu energía:\n\n• Alta energía → Tareas difíciles\n• Baja energía → Tareas simples\n• Energía media → Creatividad\n\n¿Quieres que te ayude a planificar tu semana?',
        'El secreto de la productividad no es hacer más, sino hacer lo correcto en el momento correcto. ✨\n\n¿En qué fase de tu ciclo estás? Puedo sugerirte tareas ideales para hoy.',
      ],
    },
    general: {
      es: [
        '¡Hola! Soy Laura, tu asistente de Yayika. 💜\n\nPuedo ayudarte con:\n• 🌙 Tu ciclo menstrual y energía\n• 💰 Finanzas personales\n• 📋 Productividad\n\n¿Qué te gustaría saber?',
        '¡Bienvenida a Yayika! 🎉\n\nSoy Laura y estoy aquí para acompañarte. Pregúntame lo que quieras sobre tu ciclo, dinero o productividad.\n\n¿Por dónde empezamos?',
      ],
    },
  },
  suggestions: {
    cycle: { es: ['¿En qué fase estoy?', 'Consejos de energía', '¿Qué hago hoy?'] },
    finance: { es: ['Crear presupuesto', 'Meta de ahorro', 'Analizar gastos'] },
    productivity: { es: ['Tareas por fase', 'Organizar semana', 'Consejos de enfoque'] },
    general: { es: ['🌙 Mi ciclo', '💰 Mis finanzas', '📋 Productividad'] },
  },
};

function routeMessage(message: string): keyof typeof AI_CONFIG.routing {
  const lower = message.toLowerCase();
  for (const [category, keywords] of Object.entries(AI_CONFIG.routing)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return category as keyof typeof AI_CONFIG.routing;
    }
  }
  return 'general';
}

function generateResponse(message: string): string {
  const category = routeMessage(message);
  const responses = AI_CONFIG.responses[category]?.es || AI_CONFIG.responses.general.es;
  return responses[Math.floor(Math.random() * responses.length)];
}

function getSuggestions(category: string): string[] {
  return AI_CONFIG.suggestions[category as keyof typeof AI_CONFIG.suggestions]?.es ||
    AI_CONFIG.suggestions.general.es;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy Laura, tu asistente de Yayika. Pregúntame sobre tu ciclo, finanzas o productividad. 💜',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(AI_CONFIG.suggestions.general.es);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Update suggestions based on category
    const category = routeMessage(messageText);
    setSuggestions(getSuggestions(category));

    // Simulate AI response delay
    setTimeout(() => {
      const responseText = generateResponse(messageText);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>L</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Laura</Text>
            <Text style={styles.headerSubtitle}>Asistente Yayika</Text>
          </View>
        </View>
        <View style={styles.onlineDot} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.messageBubble, msg.isUser ? styles.userBubble : styles.aiBubble]}
            >
              {!msg.isUser && (
                <View style={styles.aiAvatar}>
                  <Text style={styles.aiAvatarText}>L</Text>
                </View>
              )}
              <View style={[styles.bubble, msg.isUser ? styles.userBubbleStyle : styles.aiBubbleStyle]}>
                <Text style={[styles.messageText, msg.isUser ? styles.userText : styles.aiText]}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.aiAvatar}>
                <Text style={styles.aiAvatarText}>L</Text>
              </View>
              <View style={[styles.bubble, styles.aiBubbleStyle, styles.typingBubble]}>
                <ActivityIndicator size="small" color={colors.turquoise} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestions */}
        {suggestions.length > 0 && !isTyping && (
          <View style={styles.suggestionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe tu pregunta..."
            placeholderTextColor={colors.subtleText}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || isTyping}
          >
            <Ionicons name="arrow-up" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.turquoise,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  aiBubble: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.turquoise,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  aiAvatarText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  aiBubbleStyle: {
    backgroundColor: '#E8F5F0',
    borderBottomLeftRadius: 4,
  },
  userBubbleStyle: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiText: {
    color: colors.text,
  },
  userText: {
    color: colors.white,
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.turquoise,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
