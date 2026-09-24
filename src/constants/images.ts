/**
 * imageKey → asset, one entry per emotion in `shared/types/emotions.ts`.
 *
 * Written out by hand rather than mapped over the taxonomy because Metro
 * resolves `require` at build time: the path has to be a literal, so a computed
 * `require(`.../${e.imageKey}.png`)` bundles nothing. Adding an emotion means
 * adding its line here too — the keys are the taxonomy's `imageKey` values.
 */
export const MOOD_IMAGES: { [key: string]: any } = {
    happy: require('../../assets/images/emojis/Happy.png'),
    excited: require('../../assets/images/emojis/Excited.png'),
    calm: require('../../assets/images/emojis/Calm.png'),
    confused: require('../../assets/images/emojis/Confused.png'),
    bored: require('../../assets/images/emojis/Bored.png'),
    tired: require('../../assets/images/emojis/Tired.png'),
    sad: require('../../assets/images/emojis/Sad.png'),
    anxious: require('../../assets/images/emojis/Anxious.png'),
    angry: require('../../assets/images/emojis/Angry.png'),
};
