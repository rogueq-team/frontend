import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [userType, setUserType] = useState('advertiser');
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false
  });
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [errors, setErrors] = useState({});
  const captchaRef = useRef(null);

  const SITE_KEY = '6LfHcNwrAAAAACoTMpIEaJZjM2EYq34Xezh-8jSc';

  // Используем useCallback для оптимизации
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleAgreementChange = useCallback((e) => {
    const { name, checked } = e.target;
    setAgreements(prevState => ({
      ...prevState,
      [name]: checked
    }));
  }, []);

  const handleCaptchaChange = useCallback((value) => {
    setCaptchaVerified(!!value);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    // Проверка имени пользователя
    if (!formData.username.trim()) {
      newErrors.username = 'Имя пользователя обязательно';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Имя должно быть не менее 3 символов';
    }
    
    // Проверка email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }
    
    // Проверка пароля
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }
    
    // Проверка совпадения паролей
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите пароль';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      alert('Пожалуйста, исправьте ошибки в форме');
      return;
    }
    
    if (!agreements.terms || !agreements.privacy) {
      alert('Пожалуйста, примите все условия соглашения');
      return;
    }

    if (!captchaVerified) {
      alert('Пожалуйста, подтвердите, что вы не робот');
      return;
    }

    const captchaToken = captchaRef.current.getValue();
    
    console.log('=== ДАННЫЕ ДЛЯ РЕГИСТРАЦИИ ===');
    console.log('Тип пользователя:', userType);
    console.log('Имя:', formData.username);
    console.log('Email:', formData.email);
    console.log('Капча токен:', captchaToken);
    console.log('==============================');
    
    alert('Регистрация успешна!');
  };

  // Проверяем пароли отдельно для отображения ошибки в реальном времени
  const passwordError = formData.confirmPassword && formData.password !== formData.confirmPassword 
  ? 'Пароли не совпадают'  
  : '';

  return (
    <div className="registration-page">
      <div className="registration-container">
        <h2>Регистрация</h2>
        
        <div className="user-type-selector">
          <button
            type="button"
            className={`user-type-btn ${userType === 'advertiser' ? 'active' : ''}`}
            onClick={() => setUserType('advertiser')}
          >
            Я рекламодатель
          </button>
          <button
            type="button"
            className={`user-type-btn ${userType === 'contentmaker' ? 'active' : ''}`}
            onClick={() => setUserType('contentmaker')}
          >
            Я контентмейкер
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Имя пользователя:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
              required
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              required
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword || passwordError ? 'error' : ''}
              required
            />
            {(errors.confirmPassword || passwordError) && (
              <span className="error-message">{errors.confirmPassword || passwordError}</span>
            )}
          </div>

          <div className="agreements">
            <div className="agreement-item">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={agreements.terms}
                onChange={handleAgreementChange}
              />
              <label htmlFor="terms">
                Я принимаю условия <a href="#" className="agreement-link">Пользовательского соглашения</a>
              </label>
            </div>
            
            <div className="agreement-item">
              <input
                type="checkbox"
                id="privacy"
                name="privacy"
                checked={agreements.privacy}
                onChange={handleAgreementChange}
              />
              <label htmlFor="privacy">
                Я согласен на обработку персональных данных в соответствии с <a href="#" className="agreement-link">Политикой конфиденциальности</a>
              </label>
            </div>
          </div>

          <div className="captcha-container">
            <ReCAPTCHA
              ref={captchaRef}
              sitekey={SITE_KEY}
              onChange={handleCaptchaChange}
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={!agreements.terms || !agreements.privacy || !captchaVerified}
          >
            Зарегистрироваться
          </button>
        </form>

        <div className="register-links">
          <p>
            Уже есть аккаунт? <Link to="/login" className="link">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;