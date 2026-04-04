"""
Générateur de factures PDF pour Jam Connexion
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from io import BytesIO
from datetime import datetime


def generate_invoice_pdf(event_data: dict, venue_data: dict) -> bytes:
    """
    Génère une facture PDF pour un événement
    
    Args:
        event_data: Données de l'événement (date, montant, type, etc.)
        venue_data: Données de l'établissement (nom, adresse, etc.)
    
    Returns:
        bytes: Contenu du PDF généré
    """
    buffer = BytesIO()
    
    # Créer le document PDF
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#8B5CF6'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#6B7280'),
        spaceAfter=10
    )
    
    # Contenu du document
    story = []
    
    # En-tête
    story.append(Paragraph("🎵 JAM CONNEXION", title_style))
    story.append(Paragraph("Facture d'Événement Musical", styles['Normal']))
    story.append(Spacer(1, 20*mm))
    
    # Informations de facturation
    invoice_number = event_data.get('invoice_number', 'N/A')
    date = event_data.get('date', 'N/A')
    
    info_data = [
        ['Numéro de facture:', invoice_number],
        ['Date d\'émission:', datetime.now().strftime('%d/%m/%Y')],
        ['Date de l\'événement:', date],
    ]
    
    info_table = Table(info_data, colWidths=[80*mm, 80*mm])
    info_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    story.append(info_table)
    story.append(Spacer(1, 15*mm))
    
    # Établissement
    story.append(Paragraph("Établissement", heading_style))
    venue_name = venue_data.get('name', 'N/A')
    venue_address = venue_data.get('address', 'N/A')
    venue_city = venue_data.get('city', 'N/A')
    
    venue_info = f"{venue_name}<br/>{venue_address}<br/>{venue_city}"
    story.append(Paragraph(venue_info, styles['Normal']))
    story.append(Spacer(1, 10*mm))
    
    # Détails de l'événement
    story.append(Paragraph("Détails de l'Événement", heading_style))
    
    event_type = event_data.get('event_type_label', 'N/A').upper()
    event_title = event_data.get('title', 'Sans titre')
    event_description = event_data.get('description', '')
    
    event_details_data = [
        ['Type', event_type],
        ['Titre', event_title],
        ['Description', event_description[:100] if event_description else 'N/A'],
    ]
    
    event_table = Table(event_details_data, colWidths=[40*mm, 120*mm])
    event_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
    ]))
    
    story.append(event_table)
    story.append(Spacer(1, 10*mm))
    
    # Détails financiers
    story.append(Paragraph("Détails Financiers", heading_style))
    
    amount = event_data.get('amount', 0)
    payment_method = event_data.get('payment_method', 'N/A')
    payment_status = event_data.get('payment_status', 'N/A')
    
    financial_data = [
        ['Description', 'Montant'],
        [f'Prestation musicale - {event_type}', f"{amount} €"],
        ['', ''],
        ['TOTAL', f"{amount} €"],
    ]
    
    financial_table = Table(financial_data, colWidths=[120*mm, 40*mm])
    financial_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 11),
        ('FONT', (0, 1), (-1, -1), 'Helvetica', 10),
        ('FONT', (0, -1), (-1, -1), 'Helvetica-Bold', 12),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F3F4F6')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#8B5CF6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#374151')),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E7EB')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    story.append(financial_table)
    story.append(Spacer(1, 10*mm))
    
    # Informations de paiement
    payment_info_data = [
        ['Méthode de paiement:', payment_method],
        ['Statut:', payment_status],
    ]
    
    payment_table = Table(payment_info_data, colWidths=[80*mm, 80*mm])
    payment_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    story.append(payment_table)
    story.append(Spacer(1, 15*mm))
    
    # Pied de page
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#9CA3AF'),
        alignment=TA_CENTER
    )
    
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph("Merci pour votre confiance !", footer_style))
    story.append(Paragraph("Jam Connexion - Réseau Musical", footer_style))
    
    # Construire le PDF
    doc.build(story)
    
    # Récupérer le contenu
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return pdf_content
