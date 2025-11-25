# Guide d'Upload d'Images pour les Produits

## Système d'Upload Installé

Votre système d'upload d'images est maintenant configuré!

### Backend:
- **Endpoint d'upload**: `POST http://localhost:4000/api/upload/image`
- **Upload multiple**: `POST http://localhost:4000/api/upload/images`  
- **Images stockées dans**: `/backend/uploads/products/`
- **Accessibles via**: `http://localhost:4000/uploads/products/nom-du-fichier.jpg`

### Test Rapide avec cURL:

```bash
# Upload une seule image
curl -X POST http://localhost:4000/api/upload/image \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -F "image=@/chemin/vers/votre/image.jpg"

# Upload plusieurs images
curl -X POST http://localhost:4000/api/upload/images \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -F "images=@/chemin/vers/image1.jpg" \
  -F "images=@/chemin/vers/image2.jpg"
```

### Utiliser des Images Placeholder:

En attendant, vous pouvez utiliser des URLs d'images gratuites:

**Unsplash (images professionnelles)**:
- `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400` (Casque audio)
- `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400` (Montre)
- `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400` (Lunettes)
- `https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400` (Sac)

**Placeholder.com**:
- `https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=Produit`

### Prochaine Étape:

Je vais maintenant créer une interface d'upload dans le formulaire produit pour uploader facilement des images depuis le dashboard.
