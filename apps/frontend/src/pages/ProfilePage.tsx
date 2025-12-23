import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../entities/user/store.js";
import { profileApi, type UpdateProfileData, type ChangePasswordData } from "../entities/user/api.js";
import { Button } from "../shared/ui/Button.tsx";
import { Card } from "../shared/ui/Card.tsx";

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => profileApi.updateProfile(data),
    onSuccess: (response) => {
      setUser(response.user);
      alert("Профиль успешно обновлён");
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Ошибка при обновлении профиля");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordData) => profileApi.changePassword(data),
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Пароль успешно изменён");
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Ошибка при смене пароля");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => profileApi.deleteAccount(),
    onSuccess: () => {
      logout();
      navigate("/");
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Ошибка при удалении аккаунта");
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const data: UpdateProfileData = {};

    if (profileForm.fullName !== user?.fullName) {
      data.fullName = profileForm.fullName;
    }
    if (profileForm.email !== user?.email) {
      data.email = profileForm.email;
    }
    if (profileForm.phone !== (user?.phone || "")) {
      data.phone = profileForm.phone;
    }

    if (Object.keys(data).length === 0) {
      alert("Нет изменений для сохранения");
      return;
    }

    updateProfileMutation.mutate(data);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Пароли не совпадают");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert("Пароль должен содержать минимум 6 символов");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gradient">Профиль</h1>
          <p className="text-dark-400 mt-1">Управление личными данными</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-dark-300">{user.email}</p>
          <p className="text-xs text-primary-400 capitalize">{user.role}</p>
        </div>
      </div>

      {/* Основная информация */}
      <Card variant="glass">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <h2 className="text-xl font-bold text-dark-50">Личные данные</h2>

          <div className="space-y-2">
            <label className="text-sm text-dark-400">Имя</label>
            <input
              type="text"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-4 py-3"
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-dark-400">Email</label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-4 py-3"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-dark-400">Телефон</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-4 py-3"
              placeholder="+7 (999) 999-99-99"
            />
          </div>

          <Button
            type="submit"
            variant="gradient"
            isLoading={updateProfileMutation.isPending}
          >
            Сохранить изменения
          </Button>
        </form>
      </Card>

      {/* Смена пароля */}
      <Card variant="glass">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <h2 className="text-xl font-bold text-dark-50">Смена пароля</h2>

          <div className="space-y-2">
            <label className="text-sm text-dark-400">Текущий пароль</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-4 py-3"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-dark-400">Новый пароль</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-4 py-3"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-dark-400">Подтверждение пароля</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full rounded-xl bg-dark-900 border border-dark-700 text-dark-50 px-4 py-3"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            variant="outline"
            isLoading={changePasswordMutation.isPending}
          >
            Изменить пароль
          </Button>
        </form>
      </Card>

      {/* Удаление аккаунта */}
      <Card variant="glass" className="border-red-900/50">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-red-400">Удаление аккаунта</h2>
          <p className="text-sm text-dark-400">
            После удаления аккаунта все ваши данные будут недоступны. Это действие нельзя отменить.
          </p>

          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              className="border-red-700 text-red-400 hover:bg-red-900/20"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Удалить аккаунт
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="gradient"
                className="bg-gradient-to-r from-red-600 to-red-700"
                onClick={handleDeleteAccount}
                isLoading={deleteAccountMutation.isPending}
              >
                Да, удалить
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Отмена
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
