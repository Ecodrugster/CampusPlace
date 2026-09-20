import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Send, GraduationCap, Building, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function AuthModal({ initialMode = 'login', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('Satbayev University');
  const [faculty, setFaculty] = useState('');
  const [dormitory, setDormitory] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');

  const universities = [
    'Satbayev University',
    'КазНУ им. аль-Фараби',
    'МУИТ (IITU)',
    'КБТУ (KBTU)',
    'Назарбаев Университет (NU)',
    'ЕНУ им. Л.Гумилева',
    'Университет Сулеймана Демиреля (SDU)',
    'Другой университет'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        onSuccess(res.user);
      } else {
        const res = await api.register({
          email,
          password,
          full_name: fullName,
          university,
          faculty,
          dormitory,
          phone,
          telegram
        });
        onSuccess(res.user);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Ошибка аутентификации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-auth" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-header">
          <h2>{mode === 'login' ? 'Вход в CampusPlace' : 'Регистрация студента'}</h2>
          <p className="auth-subtext">
            {mode === 'login' 
              ? 'Войдите, чтобы покупать, продавать и сохранять товары' 
              : 'Присоединяйтесь к студенческому комьюнити маркетплейса'}
          </p>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="input-group">
              <label>Имя и Фамилия</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Арман Сейткалиев"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Студенческий или личный Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                placeholder="student@university.kz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {mode === 'register' && (
              <span className="input-hint">💡 Почта @university.kz автоматически активирует бейдж Verified Student!</span>
            )}
          </div>

          <div className="input-group">
            <label>Пароль</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div className="input-group">
                <label>Университет / ВУЗ</label>
                <div className="input-wrapper">
                  <GraduationCap size={18} className="input-icon" />
                  <select 
                    value={university} 
                    onChange={(e) => setUniversity(e.target.value)}
                    className="select-field"
                  >
                    {universities.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-row-2">
                <div className="input-group">
                  <label>Факультет</label>
                  <input 
                    type="text" 
                    placeholder="ИТ / Мехмат / Экономика"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    className="text-input"
                  />
                </div>
                <div className="input-group">
                  <label>Корпус / Общежитие</label>
                  <input 
                    type="text" 
                    placeholder="Общежитие №2"
                    value={dormitory}
                    onChange={(e) => setDormitory(e.target.value)}
                    className="text-input"
                  />
                </div>
              </div>

              <div className="input-row-2">
                <div className="input-group">
                  <label>Телефон / WhatsApp</label>
                  <div className="input-wrapper">
                    <Phone size={16} className="input-icon" />
                    <input 
                      type="text" 
                      placeholder="+7 777 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Telegram username</label>
                  <div className="input-wrapper">
                    <Send size={16} className="input-icon" />
                    <input 
                      type="text" 
                      placeholder="@username"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-full-width auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Загрузка...' : (mode === 'login' ? 'Войти в аккаунт' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="auth-footer-switch">
          {mode === 'login' ? (
            <p>
              Ещё нет аккаунта?{' '}
              <button className="text-btn-link" onClick={() => setMode('register')}>
                Зарегистрироваться
              </button>
            </p>
          ) : (
            <p>
              Уже есть аккаунт?{' '}
              <button className="text-btn-link" onClick={() => setMode('login')}>
                Войти
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
