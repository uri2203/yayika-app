import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTION_KEYS = [
  'chat_suggestion_general_1',
  'chat_suggestion_general_2',
  'chat_suggestion_general_3',
  'chat_suggestion_cycle_1',
  'chat_suggestion_finance_1',
  'chat_suggestion_productivity_1',
];

export default function ChatScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { currentColors } = useTheme();
  const { user } = useAuth();
  const colors = currentColors;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: t('chat_welcome'),
      timestamp: new Date(),
    }]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const chatHistory: ChatMessage[] = [
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: text.trim() },
      ];

      const res = await aiChat(chatHistory, t('lang_code') || 'es');
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.choices?.[0]?.message?.content || t('chat_response_general_1'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('chat_response_general_2'),
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, t]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>L</Text>
          </View>
        )}
        <View style={[styles.messageContent, isUser ? styles.userContent : styles.assistantContent]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText, { color: isUser ? '#FFF' : colors.text }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.headerAvatarText}>L</Text>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('chat_title')}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.subtleText }]}>{t('chat_subtitle')}</Text>
          </View>
        </View>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={loading ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.typingText, { color: colors.subtleText }]}>...</Text>
            </View>
          ) : null}
        />

        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            {SUGGESTION_KEYS.map((key) => {
              const suggestion = t(key);
              if (!suggestion || suggestion === key) return null;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.suggestionChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => sendMessage(suggestion)}
                >
                  <Text style={[styles.suggestionText, { color: colors.primary }]}>{suggestion}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={[styles.inputContainer, { backgroundColor: colors.white, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('chat_placeholder')}
            placeholderTextColor={colors.subtleText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerAvatarText: { color: '#FFF', fontSize: 16, fontWeight: typography.weights.bold },
  headerTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  headerSubtitle: { fontSize: typography.sizes.xs },
  chatContainer: { flex: 1 },
  messagesList: { padding: spacing.md, paddingBottom: spacing.xxl },
  messageBubble: { flexDirection: 'row', marginBottom: spacing.md, maxWidth: '85%' },
  userBubble: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  assistantBubble: { alignSelf: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  avatarText: { color: '#FFF', fontSize: 14, fontWeight: typography.weights.bold },
  messageContent: { borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  userContent: { backgroundColor: '#4E3470' },
  assistantContent: { backgroundColor: '#F3F0F7' },
  messageText: { fontSize: typography.sizes.md, lineHeight: 20 },
  userText: { color: '#FFF' },
  assistantText: { color: '#1A1A2E' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingLeft: 44, gap: spacing.xs },
  typingText: { fontSize: typography.sizes.sm },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  suggestionText: { fontSize: typography.sizes.sm },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
