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
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiChat, ChatMessage } from '../../config/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('chat_welcome'),
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    t('chat_suggestion_general_1'),
    t('chat_suggestion_general_2'),
    t('chat_suggestion_general_3'),
  ]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const buildSystemPrompt = () => {
    const name = user?.user_metadata?.name || '';
    const base = 'Eres Laura, la asistente de Yayika. Ayudas a mujeres con su ciclo, finanzas y productividad. Responde en el idioma del usuario. No uses markdown como **negrita** ni asteriscos en tus respuestas, solo texto plano.';
    const context = name ? `${base} La usuaria se llama ${name}.` : base;
    return context;
  };

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
    setSuggestions([]);

    try {
      const chatMessages: ChatMessage[] = [
        { role: 'system', content: buildSystemPrompt() },
        ...messages.slice(1).map((m) => ({
          role: m.isUser ? ('user' as const) : ('assistant' as const),
          content: m.text,
        })),
        { role: 'user', content: messageText },
      ];

      const response = await aiChat(chatMessages, lang);
      const responseText = response.choices?.[0]?.message?.content || 'Lo siento, hubo un error. Intenta de nuevo.';

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, hubo un error de conexión. Intenta de nuevo.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
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
            <Text style={styles.headerTitle}>{t('chat_title')}</Text>
            <Text style={styles.headerSubtitle}>{t('chat_subtitle')}</Text>
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
            placeholder={t('chat_placeholder')}
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
