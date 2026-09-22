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
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiChat, ChatMessage } from '../../config/api';

export default function EmpatheticChatScreen({ navigation }: any) {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const colors = currentColors;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    initChat();
  }, []);

  const initChat = async () => {
    const welcomeMsg: ChatMessage = {
      role: 'assistant',
      content: t('chat_welcome'),
    };
    setMessages([welcomeMsg]);
    setInitializing(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await aiChat(newMessages, t('lang_code'));
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.choices?.[0]?.message?.content || 'Estoy aquí para escucharte.',
      };
      setMessages([...newMessages, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: 'Estoy aquí para ti. Cuéntame cómo te sientes.',
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setLoading(false);
    }

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const suggestions = [
    t('chat_suggestion_cycle_1'),
    t('chat_suggestion_general_2'),
    t('chat_suggestion_productivity_1'),
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="heart" size={20} color={colors.rose} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('chat_title')}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg, idx) => (
            <View
              key={idx}
              style={[
                styles.messageBubble,
                msg.role === 'user'
                  ? [styles.userBubble, { backgroundColor: colors.primary }]
                  : [styles.assistantBubble, { backgroundColor: colors.assistantBubble }],
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.role === 'user'
                    ? { color: colors.white }
                    : { color: colors.text },
                ]}
              >
                {msg.content}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.assistantBubble }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </ScrollView>

        {messages.length <= 1 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((s, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.suggestionChip, { borderColor: colors.primaryLight, backgroundColor: colors.white }]}
                onPress={() => { setInput(s); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.suggestionText, { color: colors.primary }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.white }]}>
          <TextInput
            style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
            value={input}
            onChangeText={setInput}
            placeholder={t('chat_placeholder')}
            placeholderTextColor={colors.subtleText}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: input.trim() ? colors.primary : colors.border }]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: spacing.xs,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: spacing.xs,
  },
  messageText: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
