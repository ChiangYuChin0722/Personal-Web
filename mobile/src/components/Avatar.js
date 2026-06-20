import { View, Image, Text } from 'react-native';
import { getProfileColor } from '../fqcore';

export default function Avatar({ profile, size = 44, customGroups = [] }) {
  const color = getProfileColor(profile, customGroups);
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color + '22', borderWidth: 1, borderColor: color,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      {profile.photo
        ? <Image source={{ uri: profile.photo }} style={{ width: '100%', height: '100%' }} />
        : <Text style={{ fontWeight: '800', color, fontSize: size * 0.42 }}>
            {(profile.name || '?').charAt(0).toUpperCase()}
          </Text>}
    </View>
  );
}
