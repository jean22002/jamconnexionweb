#!/bin/bash
# Script de nettoyage des événements en doublon
# ATTENTION : CE SCRIPT SUPPRIME DES DONNÉES !

echo "🧹 NETTOYAGE DES ÉVÉNEMENTS EN DOUBLON"
echo "======================================"
echo ""
echo "⚠️  CE SCRIPT VA SUPPRIMER LES ÉVÉNEMENTS EN DOUBLON !"
echo "    - Garde 1 événement par date"
echo "    - Supprime tous les autres"
echo ""
echo "Voulez-vous continuer ? (yes/no)"
read -r response

if [ "$response" != "yes" ]; then
    echo "❌ Annulé"
    exit 0
fi

echo ""
echo "🔍 Analyse des doublons..."

mongosh mongodb://localhost:27017/test_database --quiet --eval "
// Fonction pour nettoyer une collection
function cleanDuplicates(collectionName) {
    const collection = db[collectionName];
    const events = collection.find({}).toArray();
    
    // Grouper par date
    const dateMap = {};
    events.forEach(event => {
        if (!dateMap[event.date]) dateMap[event.date] = [];
        dateMap[event.date].push(event);
    });
    
    let deleted = 0;
    
    // Pour chaque date avec des doublons
    Object.keys(dateMap).forEach(date => {
        if (dateMap[date].length > 1) {
            // Garder le dernier (le plus récent créé), supprimer les autres
            const toKeep = dateMap[date][dateMap[date].length - 1];
            dateMap[date].slice(0, -1).forEach(event => {
                collection.deleteOne({ _id: event._id });
                deleted++;
            });
            print('📅 ' + date + ' : gardé 1, supprimé ' + (dateMap[date].length - 1));
        }
    });
    
    return deleted;
}

print('🗑️  Nettoyage des Bœufs...');
const deletedJams = cleanDuplicates('jams');
print('   → ' + deletedJams + ' doublons supprimés');
print('');

print('🗑️  Nettoyage des Concerts...');
const deletedConcerts = cleanDuplicates('concerts');
print('   → ' + deletedConcerts + ' doublons supprimés');
print('');

print('🗑️  Nettoyage des Karaokés...');
const deletedKaraokes = cleanDuplicates('karaokes');
print('   → ' + deletedKaraokes + ' doublons supprimés');
print('');

print('🗑️  Nettoyage des Spectacles...');
const deletedSpectacles = cleanDuplicates('spectacles');
print('   → ' + deletedSpectacles + ' doublons supprimés');
print('');

const total = deletedJams + deletedConcerts + deletedKaraokes + deletedSpectacles;
print('✅ NETTOYAGE TERMINÉ : ' + total + ' doublons supprimés au total');
"

echo ""
echo "✨ Terminé ! Redémarrez le frontend pour voir les changements."
