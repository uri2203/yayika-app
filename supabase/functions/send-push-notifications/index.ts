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
      .from('yayika_push_tokens')
      .select('user_id, expo_push_token, platform');

    if (tokensError) throw tokensError;

    const results = [];

    for (const pushToken of tokens || []) {
      try {
        // Get user's last check-in
        const { data: lastCheckin } = await supabase
          .from('yayika_cycle_logs')
          .select('logged_at')
          .eq('user_id', pushToken.user_id)
          .order('logged_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const now = new Date();
        const lastCheckinDate = lastCheckin ? new Date(lastCheckin.logged_at) : null;
        const daysSinceCheckin = lastCheckinDate 
          ? Math.floor((now.getTime() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // Get user's streak
        const { data: streakData } = await supabase
          .from('yayika_progress')
          .select('streak_days')
          .eq('user_id', pushToken.user_id)
          .maybeSingle();

        const currentStreak = streakData?.streak_days || 0;
        const lang = 'es';

        // Determine notification type and message
        let notificationType = '';
        let title = '';
        let body = '';

        // Check-in reminder (daily at 8 PM if not checked in)
        if (daysSinceCheckin >= 1 && now.getHours() >= 20) {
          notificationType = 'checkin_reminder';
          const messages: Record<string, { title: string; body: string }> = {
            es: { title: 'ðŸ”¥ Â¡Hora de tu check-in!', body: 'No olvides registrar tu dÃ­a. Â¡Gana +10 XP!' },
            en: { title: 'ðŸ”¥ Time for your check-in!', body: 'Don\'t forget to log your day. Earn +10 XP!' },
            pt: { title: 'ðŸ”¥ Hora do seu check-in!', body: 'NÃ£o esqueÃ§a de registrar seu dia. Ganhe +10 XP!' },
            fr: { title: 'ðŸ”¥ C\'est l\'heure du check-in !', body: 'N\'oubliez pas d\'enregistrer votre journÃ©e. Gagnez +10 XP !' },
            de: { title: 'ðŸ”¥ Zeit fÃ¼r dein Check-in!', body: 'Vergiss nicht, deinen Tag einzutragen. Verdiene +10 XP!' },
          };
          title = messages[lang]?.title || messages.es.title;
          body = messages[lang]?.body || messages.es.body;
        }

        // Streak warning (at 9 PM if streak exists and no check-in today)
        else if (currentStreak > 0 && daysSinceCheckin >= 1 && now.getHours() >= 21) {
          notificationType = 'streak_warning';
          const messages: Record<string, { title: string; body: string }> = {
            es: { title: 'âš ï¸ Â¡Tu racha estÃ¡ en peligro!', body: `Llevas ${currentStreak} dÃ­as. Â¡No la pierdas!` },
            en: { title: 'âš ï¸ Your streak is in danger!', body: `You have ${currentStreak} days. Don't lose it!` },
            pt: { title: 'âš ï¸ Sua sequÃªncia estÃ¡ em perigo!', body: `VocÃª tem ${currentStreak} dias. NÃ£o a perca!` },
            fr: { title: 'âš ï¸ Votre sÃ©rie est en danger !', body: `Vous avez ${currentStreak} jours. Ne la perdez pas !` },
            de: { title: 'âš ï¸ Deine Serie ist in Gefahr!', body: `Du hast ${currentStreak} Tage. Verlier sie nicht!` },
          };
          title = messages[lang]?.title || messages.es.title;
          body = messages[lang]?.body || messages.es.body;
        }

        // Phase notification (based on cycle phase)
        else if (daysSinceCheckin >= 2) {
          // Calculate approximate phase based on days since last period
          const { data: cycleData } = await supabase
            .from('yayika_cycle_logs')
            .select('logged_at')
            .eq('user_id', pushToken.user_id)
            .order('logged_at', { ascending: false })
            .limit(1)
          .maybeSingle();

          if (cycleData) {
            const lastPeriod = new Date(cycleData.logged_at);
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
                menstrual: { title: 'ðŸŒ™ Fase Menstrual', body: 'Tu cuerpo necesita descanso. Cuida de ti.' },
                follicular: { title: 'ðŸŒ± Fase Folicular', body: 'EnergÃ­a en aumento. Â¡Es buen momento para empezar!' },
                ovulatory: { title: 'â˜€ï¸ Fase Ovulatoria', body: 'Â¡Tu momento de brillar! Aprovecha esta energÃ­a.' },
                luteal: { title: 'ðŸ‚ Fase LÃºtea', body: 'Baja la intensidad. Prepara tu cuerpo para el descanso.' },
              },
              en: {
                menstrual: { title: 'ðŸŒ™ Menstrual Phase', body: 'Your body needs rest. Take care of yourself.' },
                follicular: { title: 'ðŸŒ± Follicular Phase', body: 'Energy rising. Great time to start new things!' },
                ovulatory: { title: 'â˜€ï¸ Ovulatory Phase', body: 'Your time to shine! Make the most of this energy.' },
                luteal: { title: 'ðŸ‚ Luteal Phase', body: 'Slow down. Prepare your body for rest.' },
              },
              pt: {
                menstrual: { title: 'ðŸŒ™ Fase Menstrual', body: 'Seu corpo precisa de descanso. Cuide de si.' },
                follicular: { title: 'ðŸŒ± Fase Folicular', body: 'Energia aumentando. Bom momento para comeÃ§ar!' },
                ovulatory: { title: 'â˜€ï¸ Fase OvulatÃ³ria', body: 'Sua hora de brilhar! Aproveite essa energia.' },
                luteal: { title: 'ðŸ‚ Fase LÃºtea', body: 'Reduza a intensidade. Prepare seu corpo para o descanso.' },
              },
              fr: {
                menstrual: { title: 'ðŸŒ™ Phase Menstruelle', body: 'Votre corps a besoin de repos. Prenez soin de vous.' },
                follicular: { title: 'ðŸŒ± Phase Folliculaire', body: 'Ã‰nergie en hausse. Bon moment pour commencer !' },
                ovulatory: { title: 'â˜€ï¸ Phase Ovulatoire', body: 'Votre moment de briller ! Profitez de cette Ã©nergie.' },
                luteal: { title: 'ðŸ‚ Phase LutÃ©ale', body: 'Ralentissez. PrÃ©parez votre corps au repos.' },
              },
              de: {
                menstrual: { title: 'ðŸŒ™ Menstruationsphase', body: 'Dein KÃ¶rper braucht Ruhe. Pflege dich.' },
                follicular: { title: 'ðŸŒ± Follikelphase', body: 'Energie steigt. Guter Moment um anzufangen!' },
                ovulatory: { title: 'â˜€ï¸ Ovulationsphase', body: 'Dein Moment zu glÃ¤nzen! Nutze diese Energie.' },
                luteal: { title: 'ðŸ‚ Lutealphase', body: 'Verlangsame. Bereite deinen KÃ¶rper auf Ruhe vor.' },
              },
            };
            title = messages[lang]?.[phase]?.title || messages.es[phase].title;
            body = messages[lang]?.[phase]?.body || messages.es[phase].body;
          }
        }

        // Send push notification if we have a message
        if (notificationType && pushToken.expo_push_token) {
          // Use Expo push notification service
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: pushToken.expo_push_token,
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
