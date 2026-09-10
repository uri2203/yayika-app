import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCircle, getCircleMessages, sendCircleMessage, deleteCircleMessage,
  subscribeToCircleMessages, Circle, CircleMessage
} from '../../config/api';

export default function CircleChatScreen({ navigation, route }: any) {
  const { circleId, circleName } = route.params;
  const { currentColors } = useTheme();
  const colors = currentColors;
  const { t } = useLanguage();
  const { user } = useAuth();

  const [circle, setCircle] = useState<Circle | null>(null);
  const [messages, setMessages] = useState<CircleMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    getCircle(circleId).then(setCircle).catch(() => {});
  }, [circleId]);

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await getCircleMessages(circleId);
      setMessages(msgs);
    } catch {}
  }, [circleId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Real-time subscription
  useEffect(() => {
    const sub = subscribeToCircleMessages(circleId, (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
    });
    return () => { sub.unsubscribe(); };
  }, [circleId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    try {
      setSending(true);
      setInput('');
      await sendCircleMessage(circleId, text);
    } catch (err) {
      Alert.alert(t('common_error'), err instanceof Error ? err.message : t('common_unknown_error'));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = (msg: CircleMessage) => {
    if (msg.user_id !== user?.id) return;
    Alert.alert(
      t('circles_delete_msg') || 'Eliminar mensaje',
      t('circles_delete_msg_confirm') || '¿Eliminar este mensaje?',
      [
        { text: t('common_cancel') || 'Cancelar', style: 'cancel' },
        {
          text: t('common_delete') || 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCircleMessage(msg.id);
              setMessages(prev => prev.filter(m => m.id !== msg.id));
            } catch {}
          },
        },
      ]
    );
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm, backgroundColor: colors.white,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { padding: spacing.xs, marginRight: spacing.sm },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text },
    headerSubtitle: { fontSize: typography.sizes.xs, color: colors.subtleText },
    list: { flex: 1 },
    listContent: { padding: spacing.md, paddingBottom: spacing.sm },
    messageRow: { marginBottom: spacing.md, maxWidth: '80%' },
    messageRowSelf: { alignSelf: 'flex-end' },
    messageRowOther: { alignSelf: 'flex-start' },
    messageBubble: {
      borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    },
    bubbleSelf: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    bubbleOther: { backgroundColor: colors.white, borderBottomLeftRadius: 4 },
    messageText: { fontSize: typography.sizes.sm, lineHeight: 20 },
    messageTextSelf: { color: colors.white },
    messageTextOther: { color: colors.text },
    messageMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
    messageTime: { fontSize: 10, color: colors.subtleText },
    messageSender: { fontSize: 10, fontWeight: typography.weights.bold, color: colors.primary },
    inputBar: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm, backgroundColor: colors.white,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    textInput: {
      flex: 1, backgroundColor: colors.background, borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      fontSize: typography.sizes.sm, color: colors.text, marginRight: spacing.sm,
    },
    sendBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary,
      justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { opacity: 0.5 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { fontSize: typography.sizes.sm, color: colors.subtleText },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{circle?.emoji} {circleName}</Text>
          {circle && (
            <Text style={styles.headerSubtitle}>
              {circle.description ? circle.description.substring(0, 60) : t('circles_chat') || 'Chat del círculo'}
            </Text>
          )}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={messages}
        keyExtractor={msg => msg.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item: msg }) => {
          const isSelf = msg.user_id === user?.id;
          return (
            <View style={[styles.messageRow, isSelf ? styles.messageRowSelf : styles.messageRowOther]}>
              <View style={[styles.messageBubble, isSelf ? styles.bubbleSelf : styles.bubbleOther]}>
                {!isSelf && msg.sender_name && (
                  <Text style={styles.messageSender}>{msg.sender_name}</Text>
                )}
                <Text style={[styles.messageText, isSelf ? styles.messageTextSelf : styles.messageTextOther]}>
                  {msg.content}
                </Text>
                <View style={styles.messageMeta}>
                  <Text style={[styles.messageTime, isSelf && { color: 'rgba(255,255,255,0.7)' }]}>
                    {formatTime(msg.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('circles_no_messages') || 'Envía el primer mensaje 💬'}</Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder={t('circles_message_placeholder') || 'Escribe un mensaje...'}
            placeholderTextColor={colors.subtleText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            <Ionicons name="send" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
