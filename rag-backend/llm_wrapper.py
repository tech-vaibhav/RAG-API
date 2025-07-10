# llm_wrapper.py

from llama_cpp import Llama

# Load the model from GGUF
llm = Llama(
    model_path="models/mistral-7b-instruct-v0.1.Q3_K_S.gguf",
    n_ctx=2048,
    n_threads=4,         # Use appropriate number of CPU threads
    n_batch=128,
    use_mlock=True       # Reduces RAM swapping
)

def ask_llm(prompt):
    output = llm(
        prompt,
        max_tokens=512,
        temperature=0.7,
        top_p=0.95,
        stop=["</s>", "###", "User:", "Assistant:"]
    )
    return output["choices"][0]["text"].strip()
