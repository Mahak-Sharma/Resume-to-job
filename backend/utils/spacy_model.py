import spacy

def load_spacy_model():
    try:
        return spacy.load('en_core_web_sm')
    except:
        print("Downloading en_core_web_sm model...")
        from spacy.cli import download
        download('en_core_web_sm')
        print("heillo")
        return spacy.load('en_core_web_sm')