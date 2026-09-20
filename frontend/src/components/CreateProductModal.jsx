import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Tag, MapPin, DollarSign, FileText } from 'lucide-react';
import { api } from '../api';

export default function CreateProductModal({ productToEdit = null, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Учебники');
  const [condition, setCondition] = useState('Отличное');
  const [location, setLocation] = useState('Главный кампус');
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Учебники',
    'Электроника',
    'Для комнаты',
    'Одежда',
    'Спорт и хобби'
  ];

  const conditions = [
    'Новое',
    'Как новое',
    'Отличное',
    'Хорошее',
    'Б/у'
  ];

  useEffect(() => {
    if (productToEdit) {
      setTitle(productToEdit.title || '');
      setDescription(productToEdit.description || '');
      setPrice(productToEdit.price || '');
      setCategory(productToEdit.category || 'Учебники');
      setCondition(productToEdit.condition || 'Отличное');
      setLocation(productToEdit.location || 'Главный кампус');
      setImages(productToEdit.images || []);
    }
  }, [productToEdit]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const res = await api.uploadImage(file);
      setImages((prev) => [...prev, res.url]);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки изображения');
    } finally {
      setUploading(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim() || !price) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        condition,
        location: location.trim(),
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80']
      };

      let savedProduct;
      if (productToEdit) {
        savedProduct = await api.updateProduct(productToEdit.id, payload);
      } else {
        savedProduct = await api.createProduct(payload);
      }

      onSuccess(savedProduct);
      onClose();
    } catch (err) {
      setError(err.message || 'Не удалось сохранить объявление');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header-simple">
          <h2>{productToEdit ? 'Редактировать объявление' : 'Разместить объявление'}</h2>
          <p>Продайте ненужные учебники, девайсы или вещи студентам кампуса</p>
        </div>

        {error && (
          <div className="error-alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="input-group">
            <label>Название товара *</label>
            <input 
              type="text" 
              placeholder="Например: Калькулятор Casio fx-991, Наушники, Учебник..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="input-row-2">
            <div className="input-group">
              <label>Категория *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-field">
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Состояние</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="select-field">
                {conditions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-row-2">
            <div className="input-group">
              <label>Цена (₸) *</label>
              <input 
                type="number" 
                placeholder="4500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min={0}
              />
            </div>

            <div className="input-group">
              <label>Где передать / Локация *</label>
              <input 
                type="text" 
                placeholder="Главный кампус, Общежитие №2, Библиотека"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Описание товара *</label>
            <textarea 
              rows={4}
              placeholder="Расскажите подробнее: в каком состоянии вещь, почему продаете, есть ли торг или бонусы..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Photos Upload & Preview */}
          <div className="input-group">
            <label>Фотографии товара</label>
            <div className="image-uploader-container">
              <div className="upload-controls-row">
                <label className="file-upload-btn">
                  <Upload size={16} />
                  <span>{uploading ? 'Загрузка...' : 'Загрузить файл'}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    disabled={uploading} 
                    style={{ display: 'none' }}
                  />
                </label>
                <div className="url-input-group">
                  <input 
                    type="text" 
                    placeholder="Или вставьте ссылку на фото"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                  />
                  <button type="button" className="btn btn-outline" onClick={handleAddImageUrl}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {images.length > 0 && (
                <div className="preview-grid">
                  {images.map((img, idx) => (
                    <div key={idx} className="preview-item">
                      <img src={img} alt={`Превью ${idx}`} />
                      <button 
                        type="button" 
                        className="remove-img-btn"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Сохранение...' : (productToEdit ? 'Сохранить изменения' : 'Опубликовать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
