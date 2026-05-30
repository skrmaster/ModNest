import os

folder = '.'

for filename in os.listdir(folder):

    old_path = os.path.join(folder, filename)

    if os.path.isfile(old_path):

        new_name = filename[0].lower() + filename[1:]

        if filename != new_name:

            temp_name = '__temp__' + filename

            temp_path = os.path.join(folder, temp_name)

            new_path = os.path.join(folder, new_name)

            os.rename(old_path, temp_path)
            os.rename(temp_path, new_path)

            print(f'{filename} -> {new_name}')