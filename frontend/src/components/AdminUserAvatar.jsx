import { useEffect, useState } from 'react';
import api, { errMsg } from '../services/api';

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
}

export default function AdminUserAvatar({ user, onError }) {
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl;
    if (!user.hasProfileImage) {
      setPhotoUrl('');
      return undefined;
    }

    api.get(`/auth/students/${user.id}/photo`, { responseType: 'blob' })
      .then(({ data }) => {
        objectUrl = URL.createObjectURL(data);
        if (active) setPhotoUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch((error) => {
        if (active) onError(`Could not load ${user.name}'s profile photo: ${errMsg(error)}`);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user.id, user.name, user.hasProfileImage, onError]);

  return (
    <span className="admin-user-avatar">
      {photoUrl ? <img src={photoUrl} alt="" /> : initials(user.name)}
    </span>
  );
}
