import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users with push tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('user_id, token, platform');

    if (tokensError) throw tokensError;

    const results = [];

    for (const pushToken of tokens || []) {
      try {
        // Get user's last check-in
        const { data: lastCheckin } = await supabase
          .from('retention_checkins')
          .select('logged_at')
          .eq('user_id', pushToken.user_id)
          .order('logged_at', { ascending: false })
          .limit(1)
          .single();

        const now = new Date();
        const lastCheckinDate = lastCheckin ? new Date(lastCheckin.logged_at) : null;
        const daysSinceCheckin = lastCheckinDate 
          ? Math.floor((now.getTime() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // Get user's streak
        const { data: streakData } = await supabase
          .from('user_profiles')
          .select('streak')
          .eq('user_id', pushToken.user_id)
          .single();

        const currentStreak = streakData?.streak || 0;

        // Get user's language
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('language')
          .eq('user_id', pushToken.user_id)
          .single();

        const lang = profileData?.language || 'es';

        // Determine notification type and message
        let notificationType = '';
        let title = '';
        let body = '';

        // Check-in reminder (daily at 8 PM if not checked in)
        if (daysSinceCheckin >= 1 && now.getHours() >= 20) {
          notificationType = 'checkin_reminder';
          const messages: Record<string, { title: string; body: string }> = {
            es: { title: '🔥 ¡Hora de tu check-in!', body: 'No olvides registrar tu día. ¡Gana +10 XP!' },
            en: { title: '🔥 Time for your check-in!', body: 'Don\'t forget to log your day. Earn +10 XP!' },
            pt: { title: '🔥 Hora do seu check-in!', body: 'Não esqueça de registrar seu dia. Ganhe +10 XP!' },
            fr: { title: '🔥 C\'est l\'heure du check-in !', body: 'N\'oubliez pas d\'enregistrer votre journée. Gagnez +10 XP !' },
            de: { title: '🔥 Zeit für dein Check-in!', body: 'Vergiss nicht, deinen Tag einzutragen. Verdiene +10 XP!' },
          };
          title = messages[lang]?.title || messages.es.title;
          body = messages[lang]?.body || messages.es.body;
        }

        // Streak warning (at 9 PM if streak exists and no check-in today)
        else if (currentStreak > 0 && daysSinceCheckin >= 1 && now.getHours() >= 21) {
          notificationType = 'streak_warning';
          const messages: Record<string, { title: string; body: string }> = {
            es: { title: '⚠️ ¡Tu racha está en peligro!', body: `Llevas ${currentStreak} días. ¡No la pierdas!` },
            en: { title: '⚠️ Your streak is in danger!', body: `You have ${currentStreak} days. Don't lose it!` },
            pt: { title: '⚠️ Sua sequência está em perigo!', body: `Você tem ${currentStreak} dias. Não a perca!` },
            fr: { title: '⚠️ Votre série est en danger !', body: `Vous avez ${currentStreak} jours. Ne la perdez pas !` },
            de: { title: '⚠️ Deine Serie ist in Gefahr!', body: `Du hast ${currentStreak} Tage. Verlier sie nicht!` },
          };
          title = messages[lang]?.title || messages.es.title;
          body = messages[lang]?.body || messages.es.body;
        }

        // Phase notification (based on cycle phase)
        else if (daysSinceCheckin >= 2) {
          // Calculate approximate phase based on days since last period
          const { data: cycleData } = await supabase
            .from('cycle_entries')
            .select('start_date')
            .eq('user_id', pushToken.user_id)
            .order('start_date', { ascending: false })
            .limit(1)
            .single();

          if (cycleData) {
            const lastPeriod = new Date(cycleData.start_date);
            const daysSincePeriod = Math.floor((now.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
            const cycleDay = (daysSincePeriod % 28) + 1;

            let phase = '';
            if (cycleDay <= 5) phase = 'menstrual';
            else if (cycleDay <= 13) phase = 'follicular';
            else if (cycleDay <= 16) phase = 'ovulatory';
            else phase = 'luteal';

            notificationType = `phase_${phase}`;
            const messages: Record<string, Record<string, { title: string; body: string }>> = {
              es: {
                menstrual: { title: '🌙 Fase Menstrual', body: 'Tu cuerpo necesita descanso. Cuida de ti.' },
                follicular: { title: '🌱 Fase Folicular', body: 'Energía en aumento. ¡Es buen momento para empezar!' },
                ovulatory: { title: '☀️ Fase Ovulatoria', body: '¡Tu momento de brillar! Aprovecha esta energía.' },
                luteal: { title: '🍂 Fase Lútea', body: 'Baja la intensidad. Prepara tu cuerpo para el descanso.' },
              },
              en: {
                menstrual: { title: '🌙 Menstrual Phase', body: 'Your body needs rest. Take care of yourself.' },
                follicular: { title: '🌱 Follicular Phase', body: 'Energy rising. Great time to start new things!' },
                ovulatory: { title: '☀️ Ovulatory Phase', body: 'Your time to shine! Make the most of this energy.' },
                luteal: { title: '🍂 Luteal Phase', body: 'Slow down. Prepare your body for rest.' },
              },
              pt: {
                menstrual: { title: '🌙 Fase Menstrual', body: 'Seu corpo precisa de descanso. Cuide de si.' },
                follicular: { title: '🌱 Fase Folicular', body: 'Energia aumentando. Bom momento para começar!' },
                ovulatory: { title: '☀️ Fase Ovulatória', body: 'Sua hora de brilhar! Aproveite essa energia.' },
                luteal: { title: '🍂 Fase Lútea', body: 'Reduza a intensidade. Prepare seu corpo para o descanso.' },
              },
              fr: {
                menstrual: { title: '🌙 Phase Menstruelle', body: 'Votre corps a besoin de repos. Prenez soin de vous.' },
                follicular: { title: '🌱 Phase Folliculaire', body: 'Énergie en hausse. Bon moment pour commencer !' },
                ovulatory: { title: '☀️ Phase Ovulatoire', body: 'Votre moment de briller ! Profitez de cette énergie.' },
                luteal: { title: '🍂 Phase Lutéale', body: 'Ralentissez. Préparez votre corps au repos.' },
              },
              de: {
                menstrual: { title: '🌙 Menstruationsphase', body: 'Dein Körper braucht Ruhe. Pflege dich.' },
                follicular: { title: '🌱 Follikelphase', body: 'Energie steigt. Guter Moment um anzufangen!' },
                ovulatory: { title: '☀️ Ovulationsphase', body: 'Dein Moment zu glänzen! Nutze diese Energie.' },
                luteal: { title: '🍂 Lutealphase', body: 'Verlangsame. Bereite deinen Körper auf Ruhe vor.' },
              },
            };
            title = messages[lang]?.[phase]?.title || messages.es[phase].title;
            body = messages[lang]?.[phase]?.body || messages.es[phase].body;
          }
        }

        // Send push notification if we have a message
        if (notificationType && pushToken.token) {
          // Use Expo push notification service
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: pushToken.token,
              title,
              body,
              data: { type: notificationType },
              sound: 'default',
              badge: 1,
            }),
          });

          const result = await response.json();
          results.push({
            user_id: pushToken.user_id,
            type: notificationType,
            success: response.ok,
            result,
          });
        }
      } catch (e) {
        console.error(`Error processing user ${pushToken.user_id}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
