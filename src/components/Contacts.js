import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import './Contacts.css';

function Contacts() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = (data) => {
    console.log('Фидбек отправлен:', data);
    // Здесь будет отправка на сервер
    setIsSubmitted(true);
    reset();
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  const contactInfo = [
    {
      icon: '📧',
      title: 'Email',
      value: 'support@brandconnect.ru',
      link: 'mailto:support@brandconnect.ru'
    },
    {
      icon: '📞',
      title: 'Телефон',
      value: '+7 (999) 123-45-67',
      link: 'tel:+79991234567'
    },
    {
      icon: '💬',
      title: 'Telegram',
      value: '@brandconnect_support',
      link: 'https://t.me/brandconnect_support'
    },
    {
      icon: '🏢',
      title: 'Адрес',
      value: 'г. Москва, ул. Примерная, д. 123',
      link: null
    }
  ];

  const faqItems = [
    {
      question: 'Как начать работать с платформой?',
      answer: 'Зарегистрируйтесь, выберите тип аккаунта и заполните профиль. После модерации вы сможете создавать заказы или откликаться на предложения.'
    },
    {
      question: 'Сколько стоит использование платформы?',
      answer: 'Для контентмейкеров платформа бесплатна. Для рекламодателей комиссия составляет 10% от суммы заказа.'
    },
    {
      question: 'Как происходит оплата?',
      answer: 'Рекламодатели пополняют баланс на платформе, средства резервируются при создании заказа и переводятся контентмейкеру после выполнения работы.'
    },
    {
      question: 'Какова длительность модерации?',
      answer: 'Обычно модерация занимает до 24 часов. В периоды высокой нагрузки срок может увеличиться до 48 часов.'
    }
  ];

  return (
    <div className="contacts-page">
      <div className="contacts-hero">
        <div className="hero-content">
          <h1>Свяжитесь с нами</h1>
          <p>Мы всегда рады помочь и ответить на ваши вопросы</p>
        </div>
      </div>

      <div className="contacts-content">
        <div className="container">
          <div className="contacts-grid">
            {/* Блок контактной информации */}
            <div className="contacts-info">
              <h2>Контактная информация</h2>
              <p className="section-description">
                Свяжитесь с нами удобным для вас способом. Мы отвечаем в течение 24 часов.
              </p>

              <div className="contact-cards">
                {contactInfo.map((contact, index) => (
                  <div key={index} className="contact-card">
                    <div className="contact-icon">{contact.icon}</div>
                    <div className="contact-details">
                      <h3>{contact.title}</h3>
                      {contact.link ? (
                        <a href={contact.link} className="contact-link">
                          {contact.value}
                        </a>
                      ) : (
                        <span>{contact.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* FAQ секция */}
              <div className="faq-section">
                <h2>Часто задаваемые вопросы</h2>
                <div className="faq-list">
                  {faqItems.map((item, index) => (
                    <div key={index} className="faq-item">
                      <h4>{item.question}</h4>
                      <p>{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Блок формы обратной связи */}
            <div className="feedback-form">
              <h2>Обратная связь</h2>
              <p className="section-description">
                Есть вопросы или предложения? Напишите нам, и мы обязательно ответим.
              </p>

              {isSubmitted && (
                <div className="success-message">
                  ✅ Спасибо! Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="feedback-form-content">
                <div className="form-group">
                  <label htmlFor="name">Ваше имя *</label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Введите ваше имя"
                    {...register('name', { 
                      required: 'Имя обязательно для заполнения',
                      minLength: {
                        value: 2,
                        message: 'Имя должно содержать минимум 2 символа'
                      }
                    })}
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="error-message">{errors.name.message}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="your@email.com"
                    {...register('email', { 
                      required: 'Email обязателен для заполнения',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Введите корректный email адрес'
                      }
                    })}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-message">{errors.email.message}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Тема сообщения *</label>
                  <select
                    id="subject"
                    {...register('subject', { required: 'Выберите тему сообщения' })}
                    className={errors.subject ? 'error' : ''}
                  >
                    <option value="">Выберите тему</option>
                    <option value="technical">Техническая проблема</option>
                    <option value="question">Вопрос по использованию</option>
                    <option value="suggestion">Предложение по улучшению</option>
                    <option value="partnership">Сотрудничество</option>
                    <option value="other">Другое</option>
                  </select>
                  {errors.subject && <span className="error-message">{errors.subject.message}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="message">Сообщение *</label>
                  <textarea
                    id="message"
                    placeholder="Опишите ваш вопрос или предложение..."
                    rows="6"
                    {...register('message', { 
                      required: 'Сообщение обязательно для заполнения',
                      minLength: {
                        value: 10,
                        message: 'Сообщение должно содержать минимум 10 символов'
                      }
                    })}
                    className={errors.message ? 'error' : ''}
                  />
                  {errors.message && <span className="error-message">{errors.message.message}</span>}
                </div>

                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="agreement"
                    {...register('agreement', { 
                      required: 'Необходимо согласие на обработку данных'
                    })}
                  />
                  <label htmlFor="agreement">
                    Я согласен на обработку моих персональных данных в соответствии с Политикой конфиденциальности
                  </label>
                  {errors.agreement && <span className="error-message">{errors.agreement.message}</span>}
                </div>

                <button type="submit" className="submit-btn">
                  📨 Отправить сообщение
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contacts;